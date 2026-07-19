// ============================================================
// OpenStoryflow — infinite canvas engine
// Interaction model (Miro/Milanote conventions):
//   two-finger scroll / wheel  → pan
//   pinch or ⌘/Ctrl + wheel    → zoom toward cursor
//   drag on empty canvas       → rubber-band select
//   Space / middle button / H  → pan (hand)
//   drag a card                → move · ⌥ duplicates · Shift multi-select
//   double-click empty canvas  → quick note
// Shared app state lives here (this file loads before app.js).
// ============================================================

let DB = null;                        // whole persisted database (loaded in app.js)
let cur = { projectId: null, boardId: null, path: [] };  // path = folder breadcrumb of board ids
let view = { x: 0, y: 0, scale: 1 };  // canvas transform
let selection = new Set();            // selected item ids
let activeTool = 'select';            // select | hand | note | link | todo | wall | folder | comment | aiimage | sketch | connect
let connectSrc = null;                // first card picked in connect mode
let spaceHeld = false;

const CARD_COLORS = ['#f5d76e', '#8ab4f8', '#a8d5b5', '#f0a8a8', '#c5b3e6', '#f0c390', '#e8eaed', '#3d4451'];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const DRAG_T = 4; // px of movement before a press becomes a drag

const $ = (s) => document.querySelector(s);
const canvasEl = () => $('#canvas');
const worldEl = () => $('#world');

const board = () => DB && DB.boards[cur.boardId];
const project = () => DB && DB.projects.find(p => p.id === cur.projectId);
const itemById = (id) => board() && board().items.find(i => i.id === id);

// ---------- coordinates ----------
function screenToWorld(sx, sy) {
  const r = canvasEl().getBoundingClientRect();
  return { x: (sx - r.left - view.x) / view.scale, y: (sy - r.top - view.y) / view.scale };
}
function applyView() {
  worldEl().style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  const z = $('#zoom-pct');
  if (z) z.textContent = Math.round(view.scale * 100) + '%';
}
function zoomBy(factor, cx, cy) {
  const r = canvasEl().getBoundingClientRect();
  const mx = (cx ?? r.left + r.width / 2) - r.left;
  const my = (cy ?? r.top + r.height / 2) - r.top;
  const ns = Math.min(4, Math.max(0.05, view.scale * factor));
  view.x = mx - (mx - view.x) * (ns / view.scale);
  view.y = my - (my - view.y) * (ns / view.scale);
  view.scale = ns;
  applyView();
}

// ---------- rendering ----------
function renderBoard() {
  const b = board();
  const host = $('#items');
  host.innerHTML = '';
  if (!b) return;
  // walls first so cards sit on top
  const sorted = [...b.items].sort((a, z) => (a.type === 'wall' ? -1 : 0) - (z.type === 'wall' ? -1 : 0));
  for (const it of sorted) if (it.type !== 'sketch') host.appendChild(buildItemEl(it));
  renderEdges();
  renderSketches();
  updateAlignBar();
}

function itemIconName(t) {
  return {
    note: 'file-text', link: 'link', todo: 'list-checks', wall: 'frame', folder: 'folder',
    comment: 'message-circle', aiimage: 'sparkles', image: 'image', file: 'file', sketch: 'pen-line'
  }[t] || 'file-text';
}

function buildItemEl(it) {
  const el = document.createElement('div');
  el.className = 'card' + (selection.has(it.id) ? ' selected' : '') + (it.resolved ? ' resolved' : '');
  el.dataset.id = it.id;
  el.dataset.type = it.type;
  el.style.cssText = `left:${it.x}px; top:${it.y}px; width:${it.w}px; height:${it.h}px; --card-color:${it.color || '#3d4451'};`;
  if (connectSrc === it.id) el.classList.add('connect-src');

  const head = document.createElement('div');
  head.className = 'card-head';
  head.innerHTML = `<span class="type-ico">${icon(itemIconName(it.type), 12)}</span><span class="ttl">${esc(it.title || '')}</span>`;
  const aiBtn = document.createElement('button');
  aiBtn.className = 'card-ai-btn'; aiBtn.innerHTML = icon('sparkles', 13); aiBtn.title = 'Card AI assistant';
  aiBtn.onclick = (e) => { e.stopPropagation(); openCardAI(it.id); };
  head.appendChild(aiBtn);
  el.appendChild(head);

  if (it.purpose) {
    const p = document.createElement('div');
    p.className = 'purpose-tag'; p.textContent = it.purpose; p.title = it.purpose;
    el.appendChild(p);
  }

  const body = document.createElement('div');
  body.className = 'card-body';
  fillBody(it, body, el);
  el.appendChild(body);

  const rh = document.createElement('div');
  rh.className = 'resize-handle';
  el.appendChild(rh);
  return el;
}

function fillBody(it, body, el) {
  switch (it.type) {
    case 'note':
      body.textContent = it.content || '';
      break;
    case 'wall':
      break;
    case 'folder':
      body.textContent = `${(DB.boards[it.boardId]?.items.length) || 0} items — double-click to open`;
      break;
    case 'link': {
      if (it.meta?.image) {
        const img = document.createElement('img');
        img.className = 'link-thumb'; img.src = it.meta.image; img.draggable = false;
        el.insertBefore(img, body);
      }
      body.innerHTML = `<a href="${esc(it.url || '#')}" target="_blank">${esc(it.url || '')}</a>` +
        (it.meta?.description ? `<div style="color:var(--muted);margin-top:4px">${esc(it.meta.description)}</div>` : '');
      break;
    }
    case 'todo': {
      for (let i = 0; i < (it.todos || []).length; i++) {
        const t = it.todos[i];
        const row = document.createElement('div');
        row.className = 'todo-item' + (t.done ? ' done' : '');
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = !!t.done;
        cb.onchange = () => { t.done = cb.checked; save(); renderBoard(); };
        cb.onpointerdown = (e) => e.stopPropagation();
        const txt = document.createElement('span');
        txt.className = 'todo-text'; txt.textContent = t.text;
        txt.ondblclick = (e) => {
          e.stopPropagation();
          inlineEdit(txt, t.text, (v) => { if (v.trim()) t.text = v.trim(); else it.todos.splice(i, 1); save(); renderBoard(); });
        };
        row.append(cb, txt);
        body.appendChild(row);
      }
      const add = document.createElement('div');
      add.className = 'todo-add'; add.textContent = '＋ add item';
      add.onpointerdown = (e) => e.stopPropagation();
      add.onclick = (e) => {
        e.stopPropagation();
        it.todos = it.todos || [];
        it.todos.push({ text: 'New item', done: false });
        save(); renderBoard();
      };
      body.appendChild(add);
      break;
    }
    case 'comment': {
      for (const m of it.thread || []) {
        const row = document.createElement('div');
        row.className = 'comment-msg';
        row.innerHTML = `<div>${esc(m.text)}</div><div class="cm-ts">${new Date(m.ts).toLocaleString()}</div>`;
        body.appendChild(row);
      }
      const inp = document.createElement('input');
      inp.placeholder = it.resolved ? 'Resolved ✓' : 'Reply…';
      inp.onpointerdown = (e) => e.stopPropagation();
      inp.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && inp.value.trim()) {
          it.thread = it.thread || [];
          it.thread.push({ text: inp.value.trim(), ts: Date.now() });
          save(); renderBoard();
        }
      };
      body.appendChild(inp);
      break;
    }
    case 'image': case 'aiimage': {
      if (it.dataUrl) {
        const img = document.createElement('img');
        img.src = it.dataUrl; img.draggable = false;
        body.appendChild(img);
      } else {
        body.textContent = it.pending ? '✨ generating…' : '(no image)';
      }
      break;
    }
    case 'file': {
      if (it.mime?.startsWith('video/')) {
        const v = document.createElement('video');
        v.src = it.dataUrl; v.controls = true;
        v.onpointerdown = (e) => e.stopPropagation();
        body.appendChild(v);
        const cap = document.createElement('button');
        cap.className = 'btn-secondary'; cap.innerHTML = icon('camera', 13) + ' Capture frame';
        cap.style.marginTop = '6px';
        cap.onpointerdown = (e) => e.stopPropagation();
        cap.onclick = (e) => { e.stopPropagation(); captureVideoFrame(it, v); };
        body.appendChild(cap);
        body.style.flexDirection = 'column';
      } else if (it.mime?.startsWith('audio/')) {
        const a = document.createElement('audio');
        a.src = it.dataUrl; a.controls = true;
        a.onpointerdown = (e) => e.stopPropagation();
        body.appendChild(a);
      } else {
        body.innerHTML = `${icon('file', 20)} <span>${esc(it.fileName || 'file')}</span>`;
        if (it.mime === 'application/pdf' || /\.(pdf|txt|md)$/i.test(it.fileName || '')) {
          const open = document.createElement('button');
          open.className = 'btn-secondary'; open.textContent = 'Open';
          open.onpointerdown = (e) => e.stopPropagation();
          open.onclick = (e) => { e.stopPropagation(); openFilePreview(it); };
          body.appendChild(open);
        }
      }
      break;
    }
  }
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// generic tiny inline editor for a text span
function inlineEdit(elem, initial, onDone) {
  const inp = document.createElement('input');
  inp.value = initial;
  inp.style.width = '95%';
  elem.replaceWith(inp);
  inp.focus(); inp.select();
  inp.onpointerdown = (e) => e.stopPropagation();
  const finish = () => onDone(inp.value);
  inp.onblur = finish;
  inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.onblur = null; renderBoard(); } };
}

// ---------- edges & sketches ----------
function edgePath(a, b) {
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const ar = Math.min(a.w, a.h) / 2, br = Math.min(b.w, b.h) / 2;
  const sx = ax + dx / len * ar * 0.9, sy = ay + dy / len * ar * 0.9;
  const ex = bx - dx / len * (br * 0.9 + 8), ey = by - dy / len * (br * 0.9 + 8);
  const mx = (sx + ex) / 2, my = (sy + ey) / 2;
  const curve = Math.min(60, len / 4);
  const nx = -dy / len * curve, ny = dx / len * curve;
  return `M ${sx} ${sy} Q ${mx + nx} ${my + ny} ${ex} ${ey}`;
}

function renderEdges() {
  const g = $('#edge-layer');
  g.innerHTML = '';
  const b = board();
  if (!b) return;
  b.connections = (b.connections || []).filter(c => itemById(c.from) && itemById(c.to));
  for (const c of b.connections) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', edgePath(itemById(c.from), itemById(c.to)));
    p.setAttribute('class', 'edge');
    p.setAttribute('marker-end', 'url(#arrowhead)');
    p.dataset.id = c.id;
    p.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Delete this connection?')) {
        b.connections = b.connections.filter(x => x.id !== c.id);
        save(); renderEdges();
      }
    };
    g.appendChild(p);
  }
}

// live preview line while picking a connect target
function renderConnectPreview(wx, wy) {
  let p = document.getElementById('connect-preview');
  if (!connectSrc || wx === undefined) { if (p) p.remove(); return; }
  const src = itemById(connectSrc);
  if (!src) return;
  if (!p) {
    p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.id = 'connect-preview';
    p.setAttribute('class', 'edge preview');
    $('#edge-layer').appendChild(p);
  }
  p.setAttribute('d', edgePath(src, { x: wx, y: wy, w: 1, h: 1 }));
}

function renderSketches() {
  const g = $('#sketch-layer');
  g.innerHTML = '';
  const b = board();
  if (!b) return;
  for (const it of b.items) {
    if (it.type !== 'sketch') continue;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', pointsToPath(it.points));
    p.setAttribute('class', 'sketch' + (selection.has(it.id) ? ' selected' : ''));
    p.setAttribute('stroke', it.color || '#e8eaed');
    p.setAttribute('stroke-width', it.width || 3);
    p.dataset.id = it.id;
    g.appendChild(p);
  }
}
function pointsToPath(pts) {
  if (!pts || pts.length === 0) return '';
  return 'M ' + pts.map(p => `${p[0]} ${p[1]}`).join(' L ');
}

// ---------- selection ----------
function setSelection(ids) {
  selection = new Set(ids);
  document.querySelectorAll('.card').forEach(el => el.classList.toggle('selected', selection.has(el.dataset.id)));
  renderSketches();
  updateAlignBar();
}
function updateAlignBar() {
  $('#align-bar').hidden = selection.size < 2;
}

// ---------- create / mutate ----------
function defaultsFor(type) {
  const d = { note: [220, 130], link: [260, 120], todo: [240, 160], wall: [420, 320],
    folder: [220, 110], comment: [230, 120], aiimage: [280, 280], image: [280, 220], file: [260, 130] };
  return d[type] || [220, 130];
}

function createItem(type, wx, wy, extra = {}) {
  const [w, h] = defaultsFor(type);
  const it = {
    id: uid(), type, x: Math.round(wx), y: Math.round(wy), w, h,
    title: extra.title ?? ({ note: 'Note', link: 'Link', todo: 'To-do', wall: 'Section',
      folder: 'Folder', comment: 'Comment', aiimage: 'AI Image', image: 'Image', file: 'File' }[type] || 'Card'),
    color: extra.color ?? (type === 'wall' ? '#3d4451' : '#f5d76e'),
    ...extra
  };
  if (type === 'todo' && !it.todos) it.todos = [{ text: 'First item', done: false }];
  if (type === 'comment' && !it.thread) it.thread = [];
  if (type === 'folder' && !it.boardId) {
    const nb = { id: uid(), projectId: cur.projectId, name: it.title, items: [], connections: [], parentItemId: it.id };
    DB.boards[nb.id] = nb;
    it.boardId = nb.id;
  }
  board().items.push(it);
  save(); renderBoard();
  return it;
}

function deleteItems(ids) {
  const b = board();
  for (const id of ids) {
    const it = itemById(id);
    if (it?.type === 'folder' && it.boardId) deleteBoardTree(it.boardId);
  }
  b.items = b.items.filter(i => !ids.includes(i.id));
  b.connections = (b.connections || []).filter(c => !ids.includes(c.from) && !ids.includes(c.to));
  setSelection([]);
  save(); renderBoard();
}
function deleteBoardTree(boardId) {
  const b = DB.boards[boardId];
  if (!b) return;
  for (const it of b.items) if (it.type === 'folder' && it.boardId) deleteBoardTree(it.boardId);
  delete DB.boards[boardId];
}

function duplicateItems(ids, offset = 24) {
  const clones = [];
  const idMap = {};
  for (const id of ids) {
    const it = itemById(id);
    if (!it) continue;
    const c = JSON.parse(JSON.stringify(it));
    c.id = uid();
    idMap[id] = c.id;
    c.x += offset; c.y += offset;
    if (c.type === 'sketch') c.points = c.points.map(p => [p[0] + offset, p[1] + offset]);
    if (c.type === 'folder' && it.boardId) {
      c.boardId = cloneBoardTree(it.boardId, c.id);
    }
    board().items.push(c);
    clones.push(c);
  }
  // copy connections among the duplicated set
  for (const con of board().connections || []) {
    if (idMap[con.from] && idMap[con.to]) {
      board().connections.push({ id: uid(), from: idMap[con.from], to: idMap[con.to] });
    }
  }
  save(); renderBoard();
  setSelection(clones.map(c => c.id));
  return clones;
}
function cloneBoardTree(boardId, parentItemId) {
  const src = DB.boards[boardId];
  const nb = JSON.parse(JSON.stringify(src));
  nb.id = uid(); nb.parentItemId = parentItemId;
  for (const it of nb.items) {
    const old = it.id; it.id = uid();
    for (const c of nb.connections || []) { if (c.from === old) c.from = it.id; if (c.to === old) c.to = it.id; }
    if (it.type === 'folder' && it.boardId) it.boardId = cloneBoardTree(it.boardId, it.id);
  }
  DB.boards[nb.id] = nb;
  return nb.id;
}

// ---------- alignment ----------
function alignSelection(mode) {
  const items = [...selection].map(itemById).filter(i => i && i.type !== 'sketch');
  if (items.length < 2) return;
  items.sort((a, b) => (a.x - b.x) || (a.y - b.y));
  const GAP = 24;
  if (mode === 'row') {
    const y = Math.min(...items.map(i => i.y));
    let x = Math.min(...items.map(i => i.x));
    for (const i of items) { i.x = x; i.y = y; x += i.w + GAP; }
  } else if (mode === 'col') {
    items.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const x = Math.min(...items.map(i => i.x));
    let y = Math.min(...items.map(i => i.y));
    for (const i of items) { i.x = x; i.y = y; y += i.h + GAP; }
  } else if (mode === 'grid') {
    const cols = Math.ceil(Math.sqrt(items.length));
    const x0 = Math.min(...items.map(i => i.x)), y0 = Math.min(...items.map(i => i.y));
    const cw = Math.max(...items.map(i => i.w)) + GAP, ch = Math.max(...items.map(i => i.h)) + GAP;
    items.forEach((i, n) => { i.x = x0 + (n % cols) * cw; i.y = y0 + Math.floor(n / cols) * ch; });
  } else if (mode === 'dist-h') {
    items.sort((a, b) => a.x - b.x);
    const min = items[0].x, max = Math.max(...items.map(i => i.x + i.w));
    const total = items.reduce((s, i) => s + i.w, 0);
    const gap = Math.max(GAP, (max - min - total) / (items.length - 1));
    let x = min;
    for (const i of items) { i.x = x; x += i.w + gap; }
  } else if (mode === 'dist-v') {
    items.sort((a, b) => a.y - b.y);
    const min = items[0].y, max = Math.max(...items.map(i => i.y + i.h));
    const total = items.reduce((s, i) => s + i.h, 0);
    const gap = Math.max(GAP, (max - min - total) / (items.length - 1));
    let y = min;
    for (const i of items) { i.y = y; y += i.h + gap; }
  }
  save(); renderBoard();
}

// ---------- view helpers ----------
function boardBBox(items) {
  const list = items || board()?.items || [];
  if (!list.length) return null;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const i of list) {
    if (i.type === 'sketch') {
      for (const p of i.points) { x1 = Math.min(x1, p[0]); y1 = Math.min(y1, p[1]); x2 = Math.max(x2, p[0]); y2 = Math.max(y2, p[1]); }
    } else {
      x1 = Math.min(x1, i.x); y1 = Math.min(y1, i.y); x2 = Math.max(x2, i.x + i.w); y2 = Math.max(y2, i.y + i.h);
    }
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function zoomToFit() {
  const bb = boardBBox();
  const r = canvasEl().getBoundingClientRect();
  if (!bb) { view = { x: r.width / 2, y: r.height / 2, scale: 1 }; applyView(); return; }
  const pad = 60;
  const scale = Math.min(1.5, Math.min((r.width - pad * 2) / bb.w, (r.height - pad * 2) / bb.h));
  view.scale = Math.max(0.05, scale);
  view.x = (r.width - bb.w * view.scale) / 2 - bb.x * view.scale;
  view.y = (r.height - bb.h * view.scale) / 2 - bb.y * view.scale;
  applyView();
}

function centerOnItem(it) {
  const r = canvasEl().getBoundingClientRect();
  view.scale = Math.max(view.scale, 0.9);
  view.x = r.width / 2 - (it.x + it.w / 2) * view.scale;
  view.y = r.height / 2 - (it.y + it.h / 2) * view.scale;
  applyView();
}

// fit a specific set of items into view (used after inserting a tactic/template
// so the user sees exactly what was added, not the whole board zoomed out)
function focusItems(items) {
  const bb = boardBBox(items);
  if (!bb) { zoomToFit(); return; }
  const r = canvasEl().getBoundingClientRect();
  const pad = 80;
  const scale = Math.min(1.15, (r.width - pad * 2) / bb.w, (r.height - pad * 2) / bb.h);
  view.scale = Math.max(0.05, scale);
  view.x = (r.width - bb.w * view.scale) / 2 - bb.x * view.scale;
  view.y = (r.height - bb.h * view.scale) / 2 - bb.y * view.scale;
  applyView();
}

// viewport center in world coords — used to place new AI/template content
function viewportCenterWorld() {
  const r = canvasEl().getBoundingClientRect();
  return screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
}

// ---------- tools ----------
function setTool(t) {
  activeTool = t;
  connectSrc = null;
  renderConnectPreview();
  document.querySelectorAll('#toolbar .tool[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  const cv = canvasEl();
  cv.classList.toggle('tool-active', !['select', 'hand'].includes(t));
  cv.classList.toggle('hand', t === 'hand');
  renderBoard();
}

// ---------- pointer interactions ----------
function initCanvasEvents() {
  const cv = canvasEl();
  let drag = null; // {mode, started, ...}

  const isInteractive = (t) =>
    !!(t.closest && (t.closest('#align-bar, #zoom-controls') ||
    t.closest('input, textarea, select, button, a, [contenteditable="true"], video, audio')));

  cv.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;                 // right button → contextmenu handler
    if (isInteractive(e.target)) return;
    hideCtxMenu();
    const w = screenToWorld(e.clientX, e.clientY);
    const cardEl = e.target.closest('.card');
    const sketchEl = e.target.closest('path.sketch');
    const pan = e.button === 1 || spaceHeld || activeTool === 'hand';

    // --- pan (hand / space / middle button) ---
    if (pan) {
      drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
      cv.classList.add('panning');
      e.preventDefault();
      return;
    }

    // --- sketch tool: draw ---
    if (activeTool === 'sketch') {
      const it = { id: uid(), type: 'sketch', points: [[w.x, w.y]], color: DB.settings.sketchColor || '#e8eaed', width: 3 };
      board().items.push(it);
      drag = { mode: 'sketch', it };
      e.preventDefault();
      return;
    }

    // --- creation tools (click places the object) ---
    if (!['select', 'connect'].includes(activeTool) && !cardEl) {
      const tool = activeTool;
      if (!e.shiftKey) setTool('select'); // reset tool FIRST so its re-render can't wipe the new card's edit mode
      handleCreateTool(tool, w);
      return;
    }

    // --- connect tool ---
    if (activeTool === 'connect') {
      if (cardEl) {
        const id = cardEl.dataset.id;
        if (!connectSrc) { connectSrc = id; renderBoard(); toast('Now click the target card'); }
        else if (connectSrc !== id) {
          board().connections = board().connections || [];
          board().connections.push({ id: uid(), from: connectSrc, to: id });
          connectSrc = null;
          renderConnectPreview();
          save(); setTool('select');
        }
      }
      return;
    }

    // --- resize ---
    if (e.target.classList.contains('resize-handle') && cardEl) {
      const it = itemById(cardEl.dataset.id);
      drag = { mode: 'resize', it, sx: w.x, sy: w.y, ow: it.w, oh: it.h };
      e.preventDefault();
      return;
    }

    // --- press on a card: select now, move after threshold ---
    if (cardEl) {
      const id = cardEl.dataset.id;
      if (!selection.has(id)) setSelection(e.shiftKey ? [...selection, id] : [id]);
      else if (e.shiftKey) { const s = new Set(selection); s.delete(id); setSelection([...s]); return; }
      drag = { mode: 'move', started: false, alt: e.altKey, sx: e.clientX, sy: e.clientY, wx: w.x, wy: w.y };
      return;
    }

    // --- press on a sketch path ---
    if (sketchEl) {
      const it = itemById(sketchEl.dataset.id);
      setSelection(e.shiftKey ? [...selection, it.id] : [it.id]);
      drag = { mode: 'move-sketch', it, sx: w.x, sy: w.y, orig: it.points.map(p => [...p]) };
      return;
    }

    // --- empty canvas: rubber-band select (plain click = deselect) ---
    drag = { mode: 'rubber', started: false, sx: e.clientX, sy: e.clientY, shift: e.shiftKey, base: e.shiftKey ? [...selection] : [] };
  });

  window.addEventListener('pointermove', (e) => {
    if (activeTool === 'connect' && connectSrc) {
      const wc = screenToWorld(e.clientX, e.clientY);
      renderConnectPreview(wc.x, wc.y);
    }
    if (!drag) return;
    const w = screenToWorld(e.clientX, e.clientY);

    if (drag.mode === 'pan') {
      view.x = drag.ox + e.clientX - drag.sx;
      view.y = drag.oy + e.clientY - drag.sy;
      applyView();
      return;
    }

    if (drag.mode === 'move') {
      if (!drag.started) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < DRAG_T) return;
        drag.started = true;
        let ids = [...selection];
        if (drag.alt) ids = duplicateItems(ids, 0).map(c => c.id); // ⌥-drag duplicates, then moves the copies
        const targets = ids.map(itemById).filter(Boolean);
        // a wall drags everything visually inside it
        const extra = [];
        for (const t of targets) {
          if (t.type === 'wall') {
            for (const other of board().items) {
              if (other.id !== t.id && !ids.includes(other.id) && other.type !== 'sketch' &&
                  other.x >= t.x && other.y >= t.y && other.x + other.w <= t.x + t.w && other.y + other.h <= t.y + t.h) {
                extra.push(other);
              }
            }
          }
        }
        drag.targets = [...targets, ...extra];
        drag.orig = drag.targets.map(t => ({ x: t.x, y: t.y }));
      }
      const dx = w.x - drag.wx, dy = w.y - drag.wy;
      drag.targets.forEach((t, i) => {
        t.x = Math.round(drag.orig[i].x + dx);
        t.y = Math.round(drag.orig[i].y + dy);
        const el = document.querySelector(`.card[data-id="${t.id}"]`);
        if (el) { el.style.left = t.x + 'px'; el.style.top = t.y + 'px'; }
      });
      renderEdges();
      return;
    }

    if (drag.mode === 'move-sketch') {
      const dx = w.x - drag.sx, dy = w.y - drag.sy;
      drag.it.points = drag.orig.map(p => [p[0] + dx, p[1] + dy]);
      renderSketches();
      return;
    }

    if (drag.mode === 'resize') {
      drag.it.w = Math.max(80, Math.round(drag.ow + w.x - drag.sx));
      drag.it.h = Math.max(50, Math.round(drag.oh + w.y - drag.sy));
      const el = document.querySelector(`.card[data-id="${drag.it.id}"]`);
      if (el) { el.style.width = drag.it.w + 'px'; el.style.height = drag.it.h + 'px'; }
      renderEdges();
      return;
    }

    if (drag.mode === 'rubber') {
      if (!drag.started) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < DRAG_T) return;
        drag.started = true;
        $('#rubber-band').hidden = false;
      }
      const r = cv.getBoundingClientRect();
      const rb = $('#rubber-band');
      Object.assign(rb.style, {
        left: (Math.min(e.clientX, drag.sx) - r.left) + 'px',
        top: (Math.min(e.clientY, drag.sy) - r.top) + 'px',
        width: Math.abs(e.clientX - drag.sx) + 'px',
        height: Math.abs(e.clientY - drag.sy) + 'px'
      });
      const a = screenToWorld(Math.min(e.clientX, drag.sx), Math.min(e.clientY, drag.sy));
      const b2 = screenToWorld(Math.max(e.clientX, drag.sx), Math.max(e.clientY, drag.sy));
      const hit = board().items.filter(i => i.type !== 'sketch' &&
        i.x < b2.x && i.x + i.w > a.x && i.y < b2.y && i.y + i.h > a.y).map(i => i.id);
      setSelection([...new Set([...drag.base, ...hit])]);
      return;
    }

    if (drag.mode === 'sketch') {
      drag.it.points.push([w.x, w.y]);
      renderSketches();
    }
  });

  const endDrag = () => {
    if (!drag) return;
    if (drag.mode === 'move' && drag.started) save();
    if (drag.mode === 'resize' || drag.mode === 'move-sketch') save();
    if (drag.mode === 'sketch') {
      if (drag.it.points.length < 3) board().items = board().items.filter(i => i.id !== drag.it.id);
      save(); renderSketches();
    }
    if (drag.mode === 'rubber') {
      $('#rubber-band').hidden = true;
      if (!drag.started && !drag.shift) setSelection([]); // plain click on empty = deselect
    }
    cv.classList.remove('panning');
    drag = null;
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // wheel: scroll pans (trackpad two-finger), pinch / ⌘⌃+wheel zooms toward cursor
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    } else {
      const k = e.deltaMode === 1 ? 24 : 1; // line-mode mouse wheels
      view.x -= e.deltaX * k;
      view.y -= e.deltaY * k;
      applyView();
    }
  }, { passive: false });

  // Safari trackpad pinch (gesture events)
  let gestureScale = 1;
  cv.addEventListener('gesturestart', (e) => { e.preventDefault(); gestureScale = e.scale; });
  cv.addEventListener('gesturechange', (e) => {
    e.preventDefault();
    zoomBy(e.scale / gestureScale, e.clientX, e.clientY);
    gestureScale = e.scale;
  });
  cv.addEventListener('gestureend', (e) => e.preventDefault());

  // double-click: edit / open folder / quick note on empty canvas
  cv.addEventListener('dblclick', (e) => {
    if (isInteractive(e.target)) return;
    const cardEl = e.target.closest('.card');
    if (!cardEl) {
      const w = screenToWorld(e.clientX, e.clientY);
      const it = createItem('note', w.x - 110, w.y - 60);
      startNoteEdit(it);
      return;
    }
    const it = itemById(cardEl.dataset.id);
    if (!it) return;
    if (e.target.classList.contains('ttl')) {
      inlineEdit(e.target, it.title || '', (v) => { it.title = v; if (it.type === 'folder' && it.boardId) DB.boards[it.boardId].name = v; save(); renderBoard(); });
      return;
    }
    if (it.type === 'folder') { enterFolder(it); return; }
    if (it.type === 'note') { startNoteEdit(it); return; }
    centerOnItem(it);
  });

  // right-click context menu
  cv.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const cardEl = e.target.closest('.card');
    const sketchEl = e.target.closest('path.sketch');
    if (cardEl) {
      const id = cardEl.dataset.id;
      if (!selection.has(id)) setSelection([id]);
      showCtxMenu(e.clientX, e.clientY, itemById(id));
    } else if (sketchEl) {
      const id = sketchEl.dataset.id;
      setSelection([id]);
      showCtxMenu(e.clientX, e.clientY, itemById(id));
    } else {
      hideCtxMenu();
    }
  });

  // drag & drop upload — files land directly as cards
  cv.addEventListener('dragover', (e) => e.preventDefault());
  cv.addEventListener('drop', async (e) => {
    e.preventDefault();
    const w = screenToWorld(e.clientX, e.clientY);
    let off = 0;
    for (const f of e.dataTransfer.files) {
      await addDroppedFile(f, w.x + off, w.y + off);
      off += 30;
    }
    const txt = e.dataTransfer.getData('text/plain');
    if (!e.dataTransfer.files.length && txt) {
      if (/^https?:\/\//i.test(txt.trim())) createLinkCard(txt.trim(), w.x, w.y);
      else createItem('note', w.x, w.y, { title: 'Pasted', content: txt });
    }
  });

  // alignment buttons
  document.querySelectorAll('#align-bar button').forEach(b => {
    b.onclick = () => alignSelection(b.dataset.align);
  });

  // zoom controls
  $('#zoom-out').onclick = () => zoomBy(1 / 1.25);
  $('#zoom-in').onclick = () => zoomBy(1.25);
  $('#zoom-fit').onclick = zoomToFit;
  $('#zoom-pct').onclick = () => { view.scale = 1; applyView(); };
}

// put a note card body into edit mode. Deferred a frame so any trailing
// mousedown/click from the creating gesture can't blur it first.
function startNoteEdit(it) {
  requestAnimationFrame(() => {
    const cardEl = document.querySelector(`.card[data-id="${it.id}"]`);
    if (!cardEl) return;
    const body = cardEl.querySelector('.card-body');
    body.contentEditable = 'true';
    body.focus();
    const sel = window.getSelection(); sel.selectAllChildren(body); sel.collapseToEnd();
    body.onblur = () => { it.content = body.innerText; body.contentEditable = 'false'; save(); renderBoard(); };
    body.onkeydown = (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') body.blur(); };
  });
}

async function addDroppedFile(f, x, y) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
  if (f.type.startsWith('image/')) {
    createItem('image', x, y, { title: f.name, dataUrl, color: '#e8eaed' });
  } else {
    createItem('file', x, y, { title: f.name, fileName: f.name, mime: f.type, dataUrl,
      h: f.type.startsWith('video/') ? 240 : 110, w: f.type.startsWith('video/') ? 320 : 260 });
  }
  bumpUsage('uploads');
}

function captureVideoFrame(it, videoEl) {
  const c = document.createElement('canvas');
  c.width = videoEl.videoWidth; c.height = videoEl.videoHeight;
  c.getContext('2d').drawImage(videoEl, 0, 0);
  createItem('image', it.x + it.w + 30, it.y, {
    title: `${it.fileName} @ ${videoEl.currentTime.toFixed(1)}s`,
    dataUrl: c.toDataURL('image/png'), color: '#e8eaed'
  });
  toast('Frame captured to canvas');
}

function enterFolder(it) {
  cur.path.push(cur.boardId);
  cur.boardId = it.boardId;
  view = { x: 200, y: 150, scale: 1 };
  setSelection([]);
  renderAll();
}

// ---------- context menu ----------
function showCtxMenu(x, y, it) {
  const m = $('#ctx-menu');
  m.innerHTML = '';
  const add = (ic, label, fn, cls = '') => {
    const d = document.createElement('div');
    d.className = 'ci ' + cls; d.innerHTML = icon(ic, 14) + `<span>${label}</span>`;
    d.onclick = () => { hideCtxMenu(); fn(); };
    m.appendChild(d);
  };
  if (it.type !== 'sketch') {
    const colors = document.createElement('div');
    colors.className = 'color-row';
    for (const c of CARD_COLORS) {
      const dot = document.createElement('div');
      dot.className = 'color-dot'; dot.style.background = c;
      dot.onclick = () => { for (const id of selection) { const t = itemById(id); if (t) t.color = c; } hideCtxMenu(); save(); renderBoard(); };
      colors.appendChild(dot);
    }
    m.appendChild(colors);
    m.appendChild(document.createElement('hr'));
    add('sparkles', 'Ask AI about this card', () => openCardAI(it.id));
    add('pencil', 'Rename', () => {
      const el = document.querySelector(`.card[data-id="${it.id}"] .ttl`);
      if (el) inlineEdit(el, it.title || '', (v) => { it.title = v; save(); renderBoard(); });
    });
    add('arrow-up-right', 'Connect to…', () => { setTool('connect'); connectSrc = it.id; renderBoard(); toast('Now click the target card'); });
    add('message-circle', 'Add comment here', () => createItem('comment', it.x + it.w + 20, it.y, { title: 'Comment on ' + (it.title || 'card') }));
    if (it.type === 'comment') add('check-check', it.resolved ? 'Reopen' : 'Resolve', () => { it.resolved = !it.resolved; save(); renderBoard(); });
    add('copy', 'Duplicate (⌥drag)', () => duplicateItems([...selection]));
    if (selection.size >= 2) add('star', 'Save selection as custom Tactic', () => saveSelectionAsTactic());
    add('image', 'Export selection as PNG', () => exportSelectionPNG());
    m.appendChild(document.createElement('hr'));
  }
  add('trash-2', 'Delete', () => deleteItems([...selection]), 'danger');
  m.hidden = false;
  const mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.min(x, innerWidth - mw - 8) + 'px';
  m.style.top = Math.min(y, innerHeight - mh - 8) + 'px';
}
function hideCtxMenu() { $('#ctx-menu').hidden = true; }
window.addEventListener('pointerdown', (e) => { if (!e.target.closest('#ctx-menu')) hideCtxMenu(); }, true);

// ---------- keyboard ----------
function initKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (e.code === 'Space') {
      if (!spaceHeld) { spaceHeld = true; canvasEl().classList.add('hand'); }
      e.preventDefault();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'escape') { setTool('select'); setSelection([]); hideCtxMenu(); closeModal(); closeDrawer(); return; }
    if (!$('#modal-backdrop').hidden) return; // don't arm tools behind an open modal
    const toolKeys = { v: 'select', h: 'hand', n: 'note', l: 'link', t: 'todo', w: 'wall', f: 'folder',
      c: 'comment', g: 'aiimage', s: 'sketch', a: 'connect' };
    if (!e.metaKey && !e.ctrlKey && toolKeys[k]) { setTool(toolKeys[k]); return; }
    if (!e.metaKey && !e.ctrlKey && k === 'i') { eyeDropper(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selection.size) { deleteItems([...selection]); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'd') { e.preventDefault(); duplicateItems([...selection]); return; }
    if ((e.metaKey || e.ctrlKey) && k === '0') { e.preventDefault(); zoomToFit(); return; }
    if ((e.metaKey || e.ctrlKey) && (k === '=' || k === '+')) { e.preventDefault(); zoomBy(1.25); return; }
    if ((e.metaKey || e.ctrlKey) && k === '-') { e.preventDefault(); zoomBy(1 / 1.25); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'a') { e.preventDefault(); setSelection(board().items.map(i => i.id)); return; }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') { spaceHeld = false; if (activeTool !== 'hand') canvasEl().classList.remove('hand'); }
  });

  // paste: text → note, image → image card
  window.addEventListener('paste', async (e) => {
    if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
    const c = viewportCenterWorld();
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        await addDroppedFile(f, c.x, c.y);
        return;
      }
    }
    const txt = e.clipboardData.getData('text/plain');
    if (txt) {
      if (/^https?:\/\/\S+$/i.test(txt.trim())) createLinkCard(txt.trim(), c.x, c.y);
      else createItem('note', c.x, c.y, { title: 'Pasted', content: txt });
    }
  });
}

async function eyeDropper() {
  if (!window.EyeDropper) { toast('Eye dropper needs a Chromium-based browser', true); return; }
  try {
    const { sRGBHex } = await new window.EyeDropper().open();
    if (selection.size) {
      for (const id of selection) { const t = itemById(id); if (t) t.color = sRGBHex; }
      save(); renderBoard();
      toast('Applied ' + sRGBHex + ' to selection');
    } else {
      DB.settings.sketchColor = sRGBHex;
      save();
      toast('Picked ' + sRGBHex + ' — it will be used for new sketches');
    }
  } catch { /* user cancelled */ }
}

// ---------- tool-driven creation ----------
function handleCreateTool(tool, w) {
  if (tool === 'link') {
    promptModal('Add link', 'Paste a URL', 'https://…', (url) => {
      if (url) createLinkCard(url.trim(), w.x, w.y);
    });
    return;
  }
  if (tool === 'aiimage') {
    promptModal('Generate AI image', 'Describe the image', 'e.g. moody noir street at night, rain, neon…', (p) => {
      if (p) generateImageCard(p, w.x, w.y);
    });
    return;
  }
  // center new notes on the cursor so the click lands on the editable body, not the header
  if (tool === 'note') {
    const [cw, ch] = defaultsFor('note');
    const it = createItem('note', w.x - cw / 2, w.y - ch / 2);
    startNoteEdit(it);
    return;
  }
  createItem(tool, w.x, w.y);
}

async function createLinkCard(url, x, y) {
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const it = createItem('link', x, y, { title: 'Loading…', url, color: '#8ab4f8' });
  const meta = await window.api.linkMeta(url);
  it.title = meta.title || url;
  it.meta = meta;
  if (meta.image) it.h = 240;
  save(); renderBoard();
}

async function exportSelectionPNG() {
  const items = [...selection].map(itemById).filter(Boolean);
  const bb = boardBBox(items);
  if (!bb) return;
  await exportRegionPNG(bb, (board().name || 'selection'));
}

// Fit region into the viewport, wait a frame, capture it, restore the view.
async function exportRegionPNG(bb, name) {
  const old = { ...view };
  const r = canvasEl().getBoundingClientRect();
  const pad = 20;
  const scale = Math.min(2, (r.width - pad * 2) / bb.w, (r.height - pad * 2) / bb.h);
  view.scale = scale;
  view.x = (r.width - bb.w * scale) / 2 - bb.x * scale;
  view.y = (r.height - bb.h * scale) / 2 - bb.y * scale;
  applyView();
  setSelection([]);
  await new Promise(res => setTimeout(res, 350)); // let images/DOM settle
  const rect = {
    x: r.left + (r.width - bb.w * scale) / 2 - pad,
    y: r.top + (r.height - bb.h * scale) / 2 - pad,
    width: bb.w * scale + pad * 2,
    height: bb.h * scale + pad * 2
  };
  try {
    const ok = await window.api.exportPNG(rect, name);
    if (ok) toast('PNG exported');
  } catch (err) {
    toast('Export failed: ' + err.message, true);
  } finally {
    view = old; applyView();
  }
}

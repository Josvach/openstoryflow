// ============================================================
// OpenStoryflow — app shell: persistence, projects/boards UI,
// drawers (Tactics / Templates / Docs), modals, exports and
// the two-level AI system powered by Google Gemini.
// ============================================================

// ---------------- persistence ----------------
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => window.api.save(DB), 400);
}

function freshDB() {
  const projectId = uid();
  const boardId = uid();
  return {
    settings: {
      apiKey: '', textModel: 'gemini-2.5-flash', imageModel: 'gemini-2.5-flash-image',
      style: 'default', sketchColor: '#e8eaed', onboarded: false,
      usage: { aiCalls: 0, images: 0, uploads: 0, since: new Date().toISOString().slice(0, 10) }
    },
    projects: [{ id: projectId, name: 'My First Project', docs: [], memory: '', chat: [] }],
    boards: { [boardId]: { id: boardId, projectId, name: 'Main Board', items: [], connections: [] } },
    customTactics: []
  };
}

function bumpUsage(kind) {
  DB.settings.usage[kind] = (DB.settings.usage[kind] || 0) + 1;
  save();
}

// ---------------- boot ----------------
async function boot() {
  DB = (await window.api.load()) || freshDB();
  if (!DB.settings.usage) DB.settings.usage = { aiCalls: 0, images: 0, uploads: 0, since: new Date().toISOString().slice(0, 10) };
  cur.projectId = DB.projects[0].id;
  cur.boardId = firstBoardOf(cur.projectId);
  cur.path = [];
  hydrateIcons(document);
  initCanvasEvents();
  initKeyboard();
  initTopbar();
  initToolbar();
  initAIBar();
  renderAll();
  zoomToFit();
  if (!DB.settings.onboarded) { showHelp(true); DB.settings.onboarded = true; save(); }
}

// inject SVGs into every element carrying data-icon
function hydrateIcons(root) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    const size = el.classList.contains('tool') ? 17 : 14;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, size));
  });
}

function firstBoardOf(projectId) {
  return Object.values(DB.boards).find(b => b.projectId === projectId && !b.parentItemId)?.id;
}

function renderAll() {
  renderProjectSelect();
  renderBoardTabs();
  renderBreadcrumb();
  renderBoard();
  renderChatLog();
}

// ---------------- top bar / projects / boards ----------------
function initTopbar() {
  $('#project-select').onchange = (e) => {
    if (e.target.value === '__new__') { newProject(); return; }
    cur.projectId = e.target.value;
    cur.boardId = firstBoardOf(cur.projectId);
    cur.path = [];
    renderAll(); zoomToFit();
  };
  $('#btn-new-project').onclick = newProject;
  $('#btn-tactics').onclick = () => openDrawer('tactics');
  $('#btn-templates').onclick = () => openDrawer('templates');
  $('#btn-docs').onclick = () => openDrawer('docs');
  $('#btn-export').onclick = showExportMenu;
  $('#btn-settings').onclick = showSettings;
  $('#btn-help').onclick = () => showHelp(false);
}

function newProject() {
  promptModal('New project', 'Project name', 'e.g. Short Film 2026', (name) => {
    if (!name?.trim()) { renderProjectSelect(); return; }
    const p = { id: uid(), name: name.trim(), docs: [], memory: '', chat: [] };
    DB.projects.push(p);
    const b = { id: uid(), projectId: p.id, name: 'Main Board', items: [], connections: [] };
    DB.boards[b.id] = b;
    cur.projectId = p.id; cur.boardId = b.id; cur.path = [];
    save(); renderAll(); zoomToFit();
  });
}

function renderProjectSelect() {
  const sel = $('#project-select');
  sel.innerHTML = DB.projects.map(p =>
    `<option value="${p.id}" ${p.id === cur.projectId ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
}

function renderBoardTabs() {
  const host = $('#board-tabs');
  host.innerHTML = '';
  const boards = Object.values(DB.boards).filter(b => b.projectId === cur.projectId && !b.parentItemId);
  const rootBoard = cur.path.length ? cur.path[0] : cur.boardId;
  for (const b of boards) {
    const t = document.createElement('button');
    t.className = 'btab' + (b.id === rootBoard ? ' active' : '');
    t.textContent = b.name;
    t.onclick = () => { cur.boardId = b.id; cur.path = []; renderAll(); zoomToFit(); };
    t.ondblclick = () => {
      promptModal('Rename board', 'Board name', b.name, (v) => { if (v?.trim()) { b.name = v.trim(); save(); renderAll(); } });
    };
    t.oncontextmenu = (e) => {
      e.preventDefault();
      if (boards.length > 1 && confirm(`Delete board "${b.name}" and everything on it?`)) {
        deleteBoardTree(b.id);
        if (cur.boardId === b.id || cur.path[0] === b.id) { cur.boardId = firstBoardOf(cur.projectId); cur.path = []; }
        save(); renderAll();
      }
    };
    host.appendChild(t);
  }
  const plus = document.createElement('button');
  plus.className = 'btab'; plus.textContent = '＋';
  plus.title = 'New board in this project';
  plus.onclick = () => {
    promptModal('New board', 'Board name', 'e.g. Moodboard', (name) => {
      if (!name?.trim()) return;
      const b = { id: uid(), projectId: cur.projectId, name: name.trim(), items: [], connections: [] };
      DB.boards[b.id] = b;
      cur.boardId = b.id; cur.path = [];
      save(); renderAll();
    });
  };
  host.appendChild(plus);
}

function renderBreadcrumb() {
  const bc = $('#breadcrumb');
  if (!cur.path.length) { bc.innerHTML = ''; return; }
  const parts = [];
  for (let i = 0; i < cur.path.length; i++) {
    const b = DB.boards[cur.path[i]];
    parts.push(`<span class="crumb" data-i="${i}">${esc(b?.name || 'Board')}</span>`);
  }
  parts.push(`<b>${esc(board()?.name || 'Folder')}</b>`);
  bc.innerHTML = ' ▸ ' + parts.join(' ▸ ');
  bc.querySelectorAll('.crumb').forEach(el => {
    el.onclick = () => {
      const i = +el.dataset.i;
      cur.boardId = cur.path[i];
      cur.path = cur.path.slice(0, i);
      renderAll(); zoomToFit();
    };
  });
}

function initToolbar() {
  document.querySelectorAll('#toolbar .tool[data-tool]').forEach(b => {
    b.onclick = () => setTool(b.dataset.tool);
  });
  $('#btn-eyedropper').onclick = eyeDropper;
}

// ---------------- toast / modal helpers ----------------
let toastTimer = null;
function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = isError ? 'error' : '';
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

function openModal(title, bodyEl, wide = false) {
  $('#modal-title').textContent = title;
  const body = $('#modal-body');
  body.innerHTML = '';
  if (typeof bodyEl === 'string') body.innerHTML = bodyEl; else body.appendChild(bodyEl);
  $('#modal').classList.toggle('wide', wide);
  $('#modal-backdrop').hidden = false;
}
function closeModal() { $('#modal-backdrop').hidden = true; }
$('#modal-close').onclick = closeModal;
$('#modal-backdrop').addEventListener('mousedown', (e) => { if (e.target.id === 'modal-backdrop') closeModal(); });

function promptModal(title, label, placeholder, cb) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="form-row"><label>${esc(label)}</label><input id="pm-input" placeholder="${esc(placeholder)}"></div>
    <div class="modal-actions"><button class="btn-secondary" id="pm-cancel">Cancel</button><button class="btn-primary" id="pm-ok">OK</button></div>`;
  openModal(title, wrap);
  const inp = wrap.querySelector('#pm-input');
  inp.focus();
  const done = (v) => { closeModal(); cb(v); };
  wrap.querySelector('#pm-ok').onclick = () => done(inp.value);
  wrap.querySelector('#pm-cancel').onclick = () => done(null);
  inp.onkeydown = (e) => { if (e.key === 'Enter') done(inp.value); if (e.key === 'Escape') done(null); };
}

// ---------------- drawer (Tactics / Templates / Docs) ----------------
function openDrawer(kind) {
  $('#drawer').hidden = false;
  $('#drawer-title').textContent = { tactics: 'Tactics — expert blueprints', templates: 'Templates', docs: 'Docs' }[kind];
  const body = $('#drawer-body');
  body.innerHTML = '';
  if (kind === 'tactics') renderTacticsDrawer(body);
  if (kind === 'templates') renderTemplatesDrawer(body);
  if (kind === 'docs') renderDocsDrawer(body);
}
function closeDrawer() { $('#drawer').hidden = true; }
$('#drawer-close').onclick = closeDrawer;

// ----- Tactics -----
function allTactics() {
  return [...TACTICS, ...DB.customTactics];
}

const CAT_ICON = {
  'Filmmaking': 'clapperboard', 'Content Creation': 'megaphone', 'Business': 'trending-up',
  'Personal': 'sprout', 'Writing': 'pen-tool', 'Your Tactics': 'star',
  'Productivity': 'list-checks', 'Thinking': 'brain', 'Film': 'clapperboard',
  'Design': 'palette', 'AI': 'sparkles'
};

function renderTacticsDrawer(body) {
  let cat = 'All', q = '';
  const cats = ['All', ...TACTIC_CATEGORIES, ...(DB.customTactics.length ? ['Your Tactics'] : [])];
  const tabs = document.createElement('div');
  tabs.className = 'cat-tabs';
  const search = document.createElement('input');
  search.className = 'drawer-search'; search.placeholder = 'Search tactics…';
  const list = document.createElement('div');

  const refresh = () => {
    tabs.innerHTML = '';
    for (const c of cats) {
      const b = document.createElement('button');
      b.textContent = c; b.classList.toggle('active', c === cat);
      b.onclick = () => { cat = c; refresh(); };
      tabs.appendChild(b);
    }
    list.innerHTML = '';
    list.className = 'lib-grid';
    const items = allTactics().filter(t =>
      (cat === 'All' || t.category === cat) &&
      (!q || (t.name + ' ' + t.desc + ' ' + t.cards.map(c => c.title).join(' ')).toLowerCase().includes(q)));
    for (const t of items) {
      const el = document.createElement('div');
      el.className = 'lib-item';
      el.dataset.cat = t.category;
      el.innerHTML = `<div class="tile-thumb">${icon(CAT_ICON[t.category] || 'book-open', 26)}</div><div class="tile-body">
        <div class="li-name">${esc(t.name)}</div><div class="li-desc">${esc(t.desc || '')}</div>
        <div class="li-meta">${esc(t.category)} · ${t.cards.length} smart cards</div></div>`;
      el.onclick = () => previewTactic(t);
      list.appendChild(el);
    }
    if (!items.length) { list.className = ''; list.innerHTML = '<div style="color:var(--muted)">No tactics match.</div>'; }
  };
  search.oninput = () => { q = search.value.toLowerCase(); refresh(); };
  body.append(tabs, search, list);
  refresh();
}

function previewTactic(t) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div style="color:var(--muted);margin-bottom:10px">${esc(t.desc || '')}</div>`;
  for (const c of t.cards) {
    const pc = document.createElement('div');
    pc.className = 'preview-card';
    pc.innerHTML = `<div class="pc-title">${esc(c.title)}</div><div class="pc-purpose">${esc(c.purpose || '')}</div>`;
    wrap.appendChild(pc);
  }
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  const del = document.createElement('button');
  if (DB.customTactics.includes(t)) {
    del.className = 'btn-danger'; del.textContent = 'Delete custom tactic';
    del.onclick = () => { DB.customTactics = DB.customTactics.filter(x => x !== t); save(); closeModal(); openDrawer('tactics'); };
    actions.appendChild(del);
  }
  const btn = document.createElement('button');
  btn.className = 'btn-primary'; btn.textContent = 'Add to Canvas';
  btn.onclick = () => { addTacticToCanvas(t); closeModal(); closeDrawer(); };
  actions.appendChild(btn);
  wrap.appendChild(actions);
  openModal(t.name, wrap);
}

function addTacticToCanvas(t) {
  const c = viewportCenterWorld();
  const cols = Math.min(4, Math.ceil(Math.sqrt(t.cards.length)));
  const CW = 250, CH = 175, GAP = 22;
  const rows = Math.ceil(t.cards.length / cols);
  const x0 = c.x - (cols * (CW + GAP)) / 2, y0 = c.y - (rows * (CH + GAP)) / 2;
  const created = [];
  // backing wall so the tactic reads as one unit
  created.push(createItem('wall', x0 - 30, y0 - 64, {
    title: t.name, w: cols * (CW + GAP) + 60 - GAP, h: rows * (CH + GAP) + 94 - GAP, color: '#3d4451'
  }));
  const ids = [];
  t.cards.forEach((card, i) => {
    const it = createItem('note', x0 + (i % cols) * (CW + GAP), y0 + Math.floor(i / cols) * (CH + GAP), {
      title: card.title, content: card.content || '', purpose: card.purpose,
      tactic: t.name, color: '#8ab4f8', w: CW, h: CH
    });
    created.push(it); ids.push(it.id);
  });
  save(); renderBoard();
  setSelection(ids);
  focusItems(created);
  toast(`"${t.name}" added — every card has its own AI assistant`);
}

function saveSelectionAsTactic() {
  const items = [...selection].map(itemById).filter(i => i && ['note', 'todo'].includes(i.type));
  if (items.length < 2) { toast('Select at least 2 note/todo cards', true); return; }
  promptModal('Save as custom Tactic', 'Tactic name', 'e.g. My Doc Outline v2', (name) => {
    if (!name?.trim()) return;
    items.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    DB.customTactics.push({
      id: uid(), name: name.trim(), category: 'Your Tactics',
      desc: `Custom tactic saved from "${board().name}".`,
      cards: items.map(i => ({ title: i.title, purpose: i.purpose || `Fill in: ${i.title}`, content: '' }))
    });
    save();
    toast(`Saved as custom Tactic "${name.trim()}"`);
  });
}

// ----- Templates -----
function renderTemplatesDrawer(body) {
  const search = document.createElement('input');
  search.className = 'drawer-search'; search.placeholder = 'Search templates…';
  const list = document.createElement('div');
  const refresh = () => {
    const q = search.value.toLowerCase();
    list.innerHTML = '';
    list.className = 'lib-grid';
    for (const t of TEMPLATES.filter(t => !q || (t.name + t.desc + t.category).toLowerCase().includes(q))) {
      const el = document.createElement('div');
      el.className = 'lib-item';
      el.dataset.cat = t.category;
      el.innerHTML = `<div class="tile-thumb">${icon(CAT_ICON[t.category] || 'layout-template', 26)}</div><div class="tile-body">
        <div class="li-name">${esc(t.name)}</div><div class="li-desc">${esc(t.desc)}</div>
        <div class="li-meta">${esc(t.category)}</div></div>`;
      el.onclick = () => { insertTemplate(t); closeDrawer(); };
      list.appendChild(el);
    }
  };
  search.oninput = refresh;
  body.append(search, list);
  refresh();
}

function insertTemplate(t) {
  const c = viewportCenterWorld();
  const bb = boardBBox(t.items.map(i => ({ ...i, w: i.w || 220, h: i.h || 120 })));
  const ox = c.x - bb.x - bb.w / 2, oy = c.y - bb.y - bb.h / 2;
  const keyMap = {};
  const created = [];
  for (const spec of t.items) {
    const { key, type, x, y, ...rest } = spec;
    const it = createItem(type, x + ox, y + oy, { ...rest });
    created.push(it);
    if (key) keyMap[key] = it.id;
  }
  for (const [a, b] of t.connections || []) {
    if (keyMap[a] && keyMap[b]) board().connections.push({ id: uid(), from: keyMap[a], to: keyMap[b] });
  }
  save(); renderBoard();
  setSelection(created.filter(i => i.type !== 'wall').map(i => i.id));
  focusItems(created);
  toast(`Template "${t.name}" added — everything is editable`);
}

// ----- Docs -----
function renderDocsDrawer(body) {
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-primary'; addBtn.textContent = '＋ New Doc';
  addBtn.style.marginBottom = '10px';
  addBtn.onclick = () => {
    promptModal('New Doc', 'Document name', 'e.g. Treatment draft', (name) => {
      if (!name?.trim()) return;
      const d = { id: uid(), name: name.trim(), html: '' };
      project().docs.push(d);
      save(); openDrawer('docs'); openDocEditor(d);
    });
  };
  const list = document.createElement('div');
  for (const d of project().docs) {
    const el = document.createElement('div');
    el.className = 'lib-item row doc-item';
    el.innerHTML = `<div class="li-name">${icon('file-text', 14)} ${esc(d.name)}</div>`;
    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn'; delBtn.innerHTML = icon('trash-2', 14);
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete doc "${d.name}"?`)) { project().docs = project().docs.filter(x => x !== d); save(); openDrawer('docs'); }
    };
    el.appendChild(delBtn);
    el.onclick = () => openDocEditor(d);
    list.appendChild(el);
  }
  if (!project().docs.length) list.innerHTML = '<div style="color:var(--muted)">No docs yet. Docs are long-form text living next to your boards — the AI can read them via @mentions.</div>';
  body.append(addBtn, list);
}

function openDocEditor(d) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="doc-editor-tools">
      <button data-cmd="bold"><b>B</b></button>
      <button data-cmd="italic"><i>I</i></button>
      <button data-cmd="formatBlock" data-val="h1">H1</button>
      <button data-cmd="formatBlock" data-val="h2">H2</button>
      <button data-cmd="formatBlock" data-val="p">¶</button>
      <button data-cmd="insertUnorderedList">• List</button>
      <button data-cmd="insertOrderedList">1. List</button>
      <button id="doc-export-pdf" style="margin-left:auto">Export PDF</button>
    </div>
    <div id="doc-editor" contenteditable="true"></div>`;
  openModal(d.name, wrap, true);
  const ed = wrap.querySelector('#doc-editor');
  ed.innerHTML = d.html || '';
  ed.focus();
  const persist = () => { d.html = ed.innerHTML; save(); };
  ed.oninput = persist;
  wrap.querySelectorAll('[data-cmd]').forEach(b => {
    b.onmousedown = (e) => e.preventDefault(); // keep editor selection
    b.onclick = () => { document.execCommand(b.dataset.cmd, false, b.dataset.val || null); persist(); };
  });
  wrap.querySelector('#doc-export-pdf').onclick = async () => {
    const html = `<html><head><meta charset="utf-8"><style>
      body{font:14px/1.7 -apple-system,Georgia,serif;color:#1a1a1a;max-width:720px;margin:40px auto;padding:0 24px}
      h1{font-size:26px} h2{font-size:19px}</style></head>
      <body><h1>${esc(d.name)}</h1>${d.html}</body></html>`;
    if (await window.api.exportPDF(html, d.name)) toast('PDF exported');
  };
}

// ---------------- export menu ----------------
function showExportMenu() {
  const wrap = document.createElement('div');
  const mk = (label, desc, fn) => {
    const el = document.createElement('div');
    el.className = 'lib-item';
    el.style.marginBottom = '8px';
    el.innerHTML = `<div class="tile-body"><div class="li-name">${label}</div><div class="li-desc">${desc}</div></div>`;
    el.onclick = () => { closeModal(); fn(); };
    wrap.appendChild(el);
  };
  mk(icon('image',14) + ' Board → PNG', 'Export the whole current board as a high-quality image.', async () => {
    const bb = boardBBox();
    if (!bb) { toast('Board is empty', true); return; }
    await exportRegionPNG(bb, board().name || 'board');
  });
  mk(icon('image',14) + ' Selection → PNG', 'Export just the selected cards.', exportSelectionPNG);
  mk(icon('file-down',14) + ' Board → PDF summary', 'A clean text summary of all cards, ideal for stakeholders.', exportBoardPDF);
  mk(icon('download',14) + ' Project → JSON', 'Full project backup (boards, docs, everything). Re-importable.', () => {
    const boards = {};
    for (const [id, b] of Object.entries(DB.boards)) if (b.projectId === cur.projectId) boards[id] = b;
    const data = { openstoryflowProject: 1, project: project(), boards };
    window.api.exportText(JSON.stringify(data, null, 2), project().name.replace(/\s+/g, '-') + '.json', 'json')
      .then(ok => ok && toast('Project exported'));
  });
  mk(icon('upload',14) + ' Import project JSON', 'Load a previously exported project into this workspace.', async () => {
    const data = await window.api.importJSON();
    if (!data?.openstoryflowProject) { toast('Not a valid OpenStoryflow export', true); return; }
    data.project.id = uid();
    for (const b of Object.values(data.boards)) { b.projectId = data.project.id; DB.boards[b.id] = b; }
    DB.projects.push(data.project);
    cur.projectId = data.project.id;
    cur.boardId = firstBoardOf(cur.projectId);
    cur.path = [];
    save(); renderAll(); zoomToFit();
    toast('Project imported');
  });
  openModal('Export / Import', wrap);
}

async function exportBoardPDF() {
  const b = board();
  const rows = b.items.filter(i => !['sketch', 'wall'].includes(i.type)).sort((a, z) => (a.y - z.y) || (a.x - z.x))
    .map(i => `<h2>${esc(i.title || i.type)}</h2>${i.purpose ? `<p><i>${esc(i.purpose)}</i></p>` : ''}
      <p>${esc(i.content || (i.todos ? i.todos.map(t => (t.done ? '☑ ' : '☐ ') + t.text).join('\n') : '') || (i.url || ''))
        .replace(/\n/g, '<br>')}</p>`).join('');
  const walls = b.items.filter(i => i.type === 'wall').map(i => esc(i.title)).join(', ');
  const html = `<html><head><meta charset="utf-8"><style>
    body{font:13px/1.6 -apple-system,Helvetica,sans-serif;color:#1a1a1a;max-width:720px;margin:40px auto}
    h1{font-size:24px;border-bottom:2px solid #333;padding-bottom:6px} h2{font-size:15px;margin:14px 0 2px} p{margin:2px 0 8px}</style></head>
    <body><h1>${esc(project().name)} — ${esc(b.name)}</h1>
    ${walls ? `<p><i>Sections: ${walls}</i></p>` : ''}${rows}</body></html>`;
  if (await window.api.exportPDF(html, b.name || 'board')) toast('PDF exported');
}

// ---------------- settings & help ----------------
function showSettings() {
  const s = DB.settings;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="form-row"><label>Google Gemini API key (free — get one at aistudio.google.com → "Get API key")</label>
      <input id="set-key" type="password" value="${esc(s.apiKey)}" placeholder="AIza…"></div>
    <div class="form-row"><label>Text model</label>
      <input id="set-tmodel" value="${esc(s.textModel)}"></div>
    <div class="form-row"><label>Image model</label>
      <input id="set-imodel" value="${esc(s.imageModel)}"></div>
    <div class="form-row"><label>Project memory (the AI remembers this across sessions; it also updates itself after chats)</label>
      <textarea id="set-memory" rows="4">${esc(project().memory || '')}</textarea></div>
    <div class="form-row"><label>Usage this device (since ${esc(s.usage.since)})</label>
      <div style="display:flex;gap:18px;color:var(--muted)">
        <span>🤖 AI calls: <b>${s.usage.aiCalls || 0}</b></span>
        <span>✨ Images: <b>${s.usage.images || 0}</b></span>
        <span>📎 Uploads: <b>${s.usage.uploads || 0}</b></span>
      </div></div>
    <div class="form-row"><label>Data</label>
      <div style="color:var(--muted)">Everything (boards, docs, images, your API key) lives in this browser's local storage (IndexedDB) — nothing is sent anywhere except your prompts to Gemini. Back up or move data via Export → Project JSON.</div></div>
    <div class="modal-actions">
      <button class="btn-danger" id="set-wipe">Erase all data</button>
      <button class="btn-primary" id="set-save">Save</button>
    </div>`;
  openModal('Settings', wrap);
  wrap.querySelector('#set-save').onclick = () => {
    s.apiKey = wrap.querySelector('#set-key').value.trim();
    s.textModel = wrap.querySelector('#set-tmodel').value.trim() || 'gemini-2.5-flash';
    s.imageModel = wrap.querySelector('#set-imodel').value.trim() || 'gemini-2.5-flash-image';
    project().memory = wrap.querySelector('#set-memory').value;
    save(); closeModal(); toast('Settings saved');
  };
  wrap.querySelector('#set-wipe').onclick = () => {
    if (confirm('Erase ALL projects, boards and settings? This cannot be undone.')) {
      DB = freshDB();
      cur.projectId = DB.projects[0].id; cur.boardId = firstBoardOf(cur.projectId); cur.path = [];
      save(); closeModal(); renderAll(); zoomToFit();
    }
  };
}

function showHelp(firstRun) {
  openModal(firstRun ? 'Welcome to OpenStoryflow 👋' : 'Help & shortcuts', `
    ${firstRun ? '<p style="margin-bottom:10px">Your local infinite canvas for creative planning. Three ways to start:</p>' : ''}
    <ul class="tips-list">
      <li>💬 <b>Type into the AI chat at the bottom</b> — describe your idea and the AI builds the whole board (cards, sections, columns). Type <kbd>@</kbd> to mention a Tactic, Doc or card as extra context.</li>
      <li>📚 <b>Tactics</b> — expert blueprints (Hero's Journey, AIDA, StoryBrand…). Every tactic card has its own ✨ AI assistant that knows the card's purpose.</li>
      <li>🗂 <b>Templates</b> — pre-arranged boards (Kanban, Storyboard, Moodboard…), fully editable.</li>
    </ul>
    <p style="margin:10px 0 4px"><b>Canvas</b></p>
    <ul class="tips-list">
      <li><b>Scroll</b> (two fingers) moves around · <b>pinch</b> or <kbd>⌘</kbd>+scroll zooms · <kbd>⌘0</kbd> zoom to fit · <kbd>⌘+</kbd>/<kbd>⌘−</kbd> zoom steps</li>
      <li><b>Drag empty canvas</b> = select more cards · hold <kbd>Space</kbd> (or <kbd>H</kbd>) and drag = pan · <kbd>Shift</kbd>+click = multi-select · <kbd>⌥</kbd>+drag a card = duplicate</li>
      <li><b>Double-click empty canvas</b> = new note right there · double-click a card = edit it · double-click a folder = enter its nested canvas</li>
      <li>Tools: <kbd>N</kbd> note · <kbd>L</kbd> link · <kbd>T</kbd> to-do · <kbd>W</kbd> wall · <kbd>F</kbd> folder · <kbd>C</kbd> comment · <kbd>G</kbd> AI image · <kbd>S</kbd> sketch · <kbd>A</kbd> connect arrow · <kbd>I</kbd> eye dropper</li>
      <li>Right-click a card for colors, rename, connect, comment, AI, save-selection-as-Tactic</li>
      <li>Drag & drop any file straight onto the canvas — images, PDF, video (with frame capture), audio</li>
      <li>Select 2+ cards to get the alignment bar (row / column / grid / distribute)</li>
    </ul>
    <p style="margin:10px 0 4px"><b>AI setup</b></p>
    <ul class="tips-list">
      <li>Open ⚙ Settings and paste your free Google Gemini API key (aistudio.google.com)</li>
      <li><kbd>⌘K</kbd> focuses the AI bar from anywhere</li>
      <li>Your data lives in this browser — use Export → Project JSON for backups</li>
    </ul>`);
}

// ============================================================
// AI system — Google Gemini
// ============================================================

async function gemini(promptParts, { system = '', json = false, model = null } = {}) {
  const key = DB.settings.apiKey;
  if (!key) { showSettings(); throw new Error('Add your Gemini API key in Settings first.'); }
  const m = model || DB.settings.textModel;
  const body = {
    contents: [{ role: 'user', parts: promptParts }],
    generationConfig: json ? { responseMimeType: 'application/json' } : {}
  };
  if (system) body.system_instruction = { parts: [{ text: system }] };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 300)}`);
  }
  bumpUsage('aiCalls');
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts || [];
}

async function geminiText(prompt, opts = {}) {
  const parts = await gemini([{ text: prompt }], opts);
  return parts.map(p => p.text || '').join('');
}

const STYLE_HINTS = {
  default: 'Balanced, helpful, practical.',
  creative: 'Be bold and surprising — offer unexpected angles, metaphors and lateral ideas.',
  concise: 'Be extremely concise. No filler, no preamble, short bullet-like sentences.',
  detailed: 'Be thorough and detailed, with concrete examples for every suggestion.'
};

// compact serialization of the active board for AI context
function serializeBoard(b) {
  const items = b.items.filter(i => i.type !== 'sketch').map(i => ({
    id: i.id, type: i.type, title: i.title || '', x: i.x, y: i.y, w: i.w, h: i.h,
    color: i.color,
    purpose: i.purpose || undefined,
    content: (i.content || '').slice(0, 1200) || undefined,
    todos: i.todos?.map(t => (t.done ? '[x] ' : '[ ] ') + t.text),
    url: i.url || undefined,
    resolved: i.resolved || undefined
  }));
  const connections = (b.connections || []).map(c => ({ from: c.from, to: c.to }));
  return JSON.stringify({ boardName: b.name, items, connections });
}

// ---------------- board-level AI chat ----------------
let pendingMentions = []; // {kind:'tactic'|'doc'|'card', name, ref}

function initAIBar() {
  const input = $('#ai-input');
  const send = $('#ai-send');
  $('#ai-style').value = DB.settings.style || 'default';
  $('#ai-style').onchange = (e) => { DB.settings.style = e.target.value; save(); };
  $('#ai-toggle-log').onclick = () => { const l = $('#ai-log'); l.hidden = !l.hidden; if (!l.hidden) renderChatLog(); };
  send.onclick = sendBoardChat;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && $('#mention-menu').hidden) { e.preventDefault(); sendBoardChat(); }
    if (e.key === 'Escape') $('#mention-menu').hidden = true;
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(120, input.scrollHeight) + 'px';
    const m = input.value.slice(0, input.selectionStart).match(/@([\w-]*)$/);
    if (m) showMentionMenu(m[1]); else $('#mention-menu').hidden = true;
  });
  // ⌘K / Ctrl+K focuses the AI bar from anywhere
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
    }
  });
}

function showMentionMenu(query) {
  const menu = $('#mention-menu');
  const q = query.toLowerCase();
  const opts = [];
  const tacticCount = pendingMentions.filter(x => x.kind === 'tactic').length;
  const docCount = pendingMentions.filter(x => x.kind === 'doc').length;
  if (docCount < 3) for (const d of project().docs) if (d.name.toLowerCase().includes(q)) opts.push({ kind: 'doc', name: d.name, ref: d });
  let cardCount = 0;
  for (const i of board().items) {
    if (i.title && i.type !== 'sketch' && i.title.toLowerCase().includes(q) && cardCount < 5) { opts.push({ kind: 'card', name: i.title, ref: i }); cardCount++; }
  }
  if (tacticCount < 1) {
    let n = 0;
    for (const t of allTactics()) if (t.name.toLowerCase().includes(q) && n < 5) { opts.push({ kind: 'tactic', name: t.name, ref: t }); n++; }
  }
  menu.innerHTML = '';
  for (const o of opts.slice(0, 12)) {
    const el = document.createElement('div');
    el.className = 'mi';
    el.innerHTML = `<span>${{ tactic: '📚', doc: '📄', card: '▤' }[o.kind]} ${esc(o.name)}</span><span class="mi-kind">${o.kind}</span>`;
    el.onmousedown = (e) => { e.preventDefault(); pickMention(o, query); };
    menu.appendChild(el);
  }
  menu.hidden = !opts.length;
}

function pickMention(o, typed) {
  const input = $('#ai-input');
  const pos = input.selectionStart;
  const before = input.value.slice(0, pos).replace(new RegExp('@' + typed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '');
  const token = '@' + o.name.replace(/\s+/g, '_');
  input.value = before + token + ' ' + input.value.slice(pos);
  pendingMentions.push(o);
  $('#mention-menu').hidden = true;
  input.focus();
}

function renderChatLog() {
  const log = $('#ai-log');
  if (log.hidden) return;
  log.innerHTML = '';
  for (const m of project().chat || []) {
    const el = document.createElement('div');
    el.className = 'ai-msg ' + m.role;
    el.textContent = m.text;
    log.appendChild(el);
  }
  log.scrollTop = log.scrollHeight;
}

const BOARD_AI_SYSTEM = `You are the AI assistant inside OpenStoryflow, an infinite visual canvas app for creative planning (stories, films, marketing, personal projects). You see the user's ACTIVE BOARD as JSON: items (cards) with id, type (note/todo/wall/folder/link/comment/image), title, content, position (x,y grows right/down), size, color, and arrow connections between cards. Spatial conventions: left→right = timeline, top→bottom = priority, clustering = related topics, walls = grouping sections.

You can BOTH answer the user AND edit the canvas by returning actions. Respond ONLY with a JSON object:
{
 "reply": "your conversational answer to the user (plain text, may use simple bullets)",
 "actions": [
   {"op":"create","type":"note|todo|wall|folder","title":"...","content":"...","purpose":"optional card-purpose","todos":["item",...],"x":0,"y":0,"w":240,"h":160,"color":"#hex"},
   {"op":"update","id":"existingId","title":"...","content":"...","todos":["..."],"x":0,"y":0,"color":"#hex"},
   {"op":"delete","id":"existingId"},
   {"op":"connect","from":"idOrNewIndex","to":"idOrNewIndex"}
 ],
 "memory": "OPTIONAL: updated persistent project memory (facts, decisions, style) — return the FULL new memory text, max 150 words"
}
Rules:
- "actions" may be [] when the user only wants an answer/critique/summary.
- For create actions choose sensible positions: lay structures out left→right / in grids, ~250x170 cards with 25px gaps, walls behind groups (create walls FIRST). Place new content in the free area indicated by the given viewport center, never on top of existing cards unless updating them.
- In "connect", reference new cards by their zero-based index in this actions list as "new:0", "new:1", or existing cards by id.
- Card colors: yellow #f5d76e ideas, blue #8ab4f8 research/info, green #a8d5b5 approved/done, red #f0a8a8 risks, purple #c5b3e6 creative, neutral #e8eaed.
- When restructuring (e.g. "turn this into a mindmap"), move existing cards with update ops and add connect ops instead of recreating everything.
- Update "memory" whenever the user states lasting facts, decisions or preferences about the project.
- Reply in the same language the user writes in.`;

async function sendBoardChat() {
  const input = $('#ai-input');
  const text = input.value.trim();
  if (!text) return;
  const send = $('#ai-send');
  send.disabled = true;
  send.innerHTML = '<span class="spin">◌</span>';
  $('#ai-log').hidden = false;

  const p = project();
  p.chat = p.chat || [];
  p.chat.push({ role: 'user', text });
  renderChatLog();
  input.value = ''; input.style.height = 'auto';

  // extra context from @mentions
  let extra = '';
  for (const m of pendingMentions) {
    if (m.kind === 'tactic') {
      extra += `\n\nMENTIONED TACTIC "${m.ref.name}" (a blueprint the user wants applied):\n` +
        m.ref.cards.map(c => `- ${c.title}: ${c.purpose}`).join('\n');
    } else if (m.kind === 'doc') {
      const div = document.createElement('div'); div.innerHTML = m.ref.html || '';
      extra += `\n\nMENTIONED DOC "${m.ref.name}":\n${div.innerText.slice(0, 8000)}`;
    } else if (m.kind === 'card') {
      extra += `\n\nMENTIONED CARD "${m.ref.title}" (id ${m.ref.id}): ${m.ref.content || ''}`;
    }
  }
  pendingMentions = [];

  const c = viewportCenterWorld();
  const history = p.chat.slice(-12, -1).map(m => `${m.role}: ${m.text}`).join('\n');
  const prompt =
    `RESPONSE STYLE: ${STYLE_HINTS[DB.settings.style || 'default']}\n` +
    (p.memory ? `\nPROJECT MEMORY (persistent):\n${p.memory}\n` : '') +
    (history ? `\nRECENT CONVERSATION:\n${history}\n` : '') +
    `\nACTIVE BOARD JSON:\n${serializeBoard(board())}\n` +
    `\nCurrent viewport center (good place for new content): x=${Math.round(c.x)}, y=${Math.round(c.y)}` +
    extra +
    `\n\nUSER REQUEST:\n${text}`;

  try {
    const raw = await geminiText(prompt, { system: BOARD_AI_SYSTEM, json: true });
    let resp;
    try { resp = JSON.parse(raw); }
    catch { resp = { reply: raw, actions: [] }; }
    const n = applyAIActions(resp.actions || []);
    if (typeof resp.memory === 'string' && resp.memory.trim()) p.memory = resp.memory.trim();
    p.chat.push({ role: 'assistant', text: resp.reply || '(no reply)' });
    if (n) p.chat.push({ role: 'system', text: `✏️ applied ${n} change${n > 1 ? 's' : ''} to the board` });
    save(); renderChatLog();
    if (n) { renderBoard(); zoomToFit(); }
  } catch (err) {
    p.chat.push({ role: 'system', text: '⚠️ ' + err.message });
    renderChatLog();
  } finally {
    send.disabled = false;
    send.innerHTML = icon('send-horizontal', 14);
  }
}

function applyAIActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return 0;
  const b = board();
  const created = [];
  let count = 0;
  for (const a of actions) {
    try {
      if (a.op === 'create') {
        const type = ['note', 'todo', 'wall', 'folder'].includes(a.type) ? a.type : 'note';
        const it = createItem(type, a.x ?? 0, a.y ?? 0, {
          title: a.title || 'Card',
          content: a.content || '',
          purpose: a.purpose || undefined,
          color: a.color || (type === 'wall' ? '#3d4451' : '#f5d76e'),
          w: a.w || defaultsFor(type)[0], h: a.h || defaultsFor(type)[1],
          todos: Array.isArray(a.todos) ? a.todos.map(t => ({ text: String(t).replace(/^\[.\]\s*/, ''), done: /^\[x\]/i.test(String(t)) })) : undefined
        });
        created.push(it);
        count++;
      } else if (a.op === 'update') {
        const it = itemById(a.id);
        if (!it) continue;
        for (const k of ['title', 'content', 'x', 'y', 'w', 'h', 'color', 'purpose']) if (a[k] !== undefined) it[k] = a[k];
        if (Array.isArray(a.todos)) it.todos = a.todos.map(t => ({ text: String(t).replace(/^\[.\]\s*/, ''), done: /^\[x\]/i.test(String(t)) }));
        count++;
      } else if (a.op === 'delete') {
        if (itemById(a.id)) { b.items = b.items.filter(i => i.id !== a.id); count++; }
      } else if (a.op === 'connect') {
        const resolve = (ref) => {
          if (typeof ref === 'string' && ref.startsWith('new:')) return created[+ref.slice(4)]?.id;
          return itemById(ref)?.id;
        };
        const from = resolve(a.from), to = resolve(a.to);
        if (from && to) { b.connections = b.connections || []; b.connections.push({ id: uid(), from, to }); count++; }
      }
    } catch { /* skip malformed action */ }
  }
  b.connections = (b.connections || []).filter(cn => itemById(cn.from) && itemById(cn.to));
  save();
  return count;
}

// ---------------- card-level AI ----------------
function openCardAI(itemId) {
  const it = itemById(itemId);
  if (!it) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    ${it.purpose ? `<div style="color:var(--muted);font-style:italic;margin-bottom:8px">Card purpose: ${esc(it.purpose)}</div>` : ''}
    <div class="quick-prompts">
      <button data-q="Suggest strong content for this card based on the rest of the board.">✨ Suggest content</button>
      <button data-q="Expand the current content into fuller, richer text.">↗ Expand</button>
      <button data-q="Give me 5 alternative variants for this card's content.">×5 Variants</button>
      <button data-q="Critique this card: what is weak, what is missing?">🔍 Critique</button>
      <button data-q="Rewrite the content in a more conversational tone.">💬 Conversational</button>
      <button data-q="Make it much more concise.">— Shorten</button>
    </div>
    <div class="cai-log" id="cai-log"></div>
    <div class="cai-row">
      <textarea id="cai-input" rows="2" placeholder="Ask about this card…"></textarea>
      <button class="btn-primary" id="cai-send">Ask</button>
    </div>
    <div class="modal-actions" id="cai-apply-row" hidden>
      <button class="btn-secondary" id="cai-append">Append to card</button>
      <button class="btn-primary" id="cai-replace">Replace card content</button>
    </div>`;
  openModal(`AI — ${it.title || it.type}`, wrap);

  const log = wrap.querySelector('#cai-log');
  const applyRow = wrap.querySelector('#cai-apply-row');
  let suggestion = null;
  const addMsg = (role, text) => {
    const el = document.createElement('div');
    el.className = 'ai-msg ' + role;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  };

  const ask = async (q) => {
    if (!q.trim()) return;
    addMsg('user', q);
    addMsg('system', 'thinking…');
    const thinking = log.lastChild;
    const cardCtx = it.type === 'todo'
      ? (it.todos || []).map(t => (t.done ? '[x] ' : '[ ] ') + t.text).join('\n')
      : (it.content || '(empty)');
    const system = `You are a focused card-level AI assistant inside a visual planning canvas. You help with ONE specific card.
Card title: "${it.title}". ${it.purpose ? `The card's defined purpose: "${it.purpose}".` : ''} ${it.tactic ? `It belongs to the "${it.tactic}" blueprint.` : ''}
You also see the rest of the board for context — use other cards' content when relevant (e.g. reference the target audience card when writing messaging).
Respond ONLY as JSON: {"reply":"your answer/advice","suggestedContent":"optional — concrete new text for the card body when the user wants content written; plain text; omit when only advising"}.
Reply in the user's language.`;
    const prompt = `BOARD CONTEXT:\n${serializeBoard(board())}\n\nTHIS CARD'S CURRENT CONTENT:\n${cardCtx}\n\nUSER:\n${q}`;
    try {
      const raw = await geminiText(prompt, { system, json: true });
      let r; try { r = JSON.parse(raw); } catch { r = { reply: raw }; }
      thinking.remove();
      addMsg('assistant', r.reply || '(no reply)');
      if (r.suggestedContent) {
        suggestion = r.suggestedContent;
        addMsg('assistant', '--- suggested content ---\n' + suggestion);
        applyRow.hidden = false;
      }
    } catch (err) {
      thinking.remove();
      addMsg('system', '⚠️ ' + err.message);
    }
  };

  wrap.querySelectorAll('.quick-prompts button').forEach(b => { b.onclick = () => ask(b.dataset.q); });
  const inp = wrap.querySelector('#cai-input');
  wrap.querySelector('#cai-send').onclick = () => { ask(inp.value); inp.value = ''; };
  inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inp.value); inp.value = ''; } };

  const applyContent = (mode) => {
    if (!suggestion) return;
    if (it.type === 'todo') {
      const items = suggestion.split('\n').map(s => s.replace(/^[-*•☐\[\]x ]+/i, '').trim()).filter(Boolean)
        .map(text => ({ text, done: false }));
      it.todos = mode === 'append' ? [...(it.todos || []), ...items] : items;
    } else {
      it.content = mode === 'append' ? ((it.content ? it.content + '\n\n' : '') + suggestion) : suggestion;
    }
    save(); renderBoard(); closeModal();
    toast('Card updated');
  };
  wrap.querySelector('#cai-replace').onclick = () => applyContent('replace');
  wrap.querySelector('#cai-append').onclick = () => applyContent('append');
}

// ---------------- AI image generation ----------------
async function generateImageCard(prompt, x, y) {
  const it = createItem('aiimage', x, y, { title: prompt.slice(0, 48), pending: true, prompt, color: '#c5b3e6' });
  // keep the "recipe" next to the output
  createItem('note', x, y + defaultsFor('aiimage')[1] + 16, {
    title: 'Prompt recipe', content: prompt, color: '#c5b3e6', w: 280, h: 100
  });
  toast('Generating image…');
  try {
    const parts = await gemini([{ text: prompt }], { model: DB.settings.imageModel });
    const img = parts.find(p => p.inlineData);
    if (!img) throw new Error('Model returned no image — check the image model name in Settings.');
    it.dataUrl = `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
    it.pending = false;
    bumpUsage('images');
    save(); renderBoard();
    toast('Image ready');
  } catch (err) {
    it.pending = false;
    it.title = '⚠️ generation failed';
    save(); renderBoard();
    toast(err.message, true);
  }
}

// ---------------- file preview (PDF / text) ----------------
function openFilePreview(it) {
  const wrap = document.createElement('div');
  if (it.mime === 'application/pdf') {
    wrap.innerHTML = `<embed src="${it.dataUrl}" type="application/pdf" style="width:100%;height:70vh;border-radius:8px">`;
  } else {
    // decode text files from data URL
    try {
      const b64 = it.dataUrl.split(',')[1];
      const text = decodeURIComponent(escape(atob(b64)));
      wrap.innerHTML = `<pre style="white-space:pre-wrap;user-select:text;max-height:70vh;overflow:auto">${esc(text)}</pre>`;
    } catch {
      wrap.textContent = 'Cannot preview this file.';
    }
  }
  openModal(it.fileName || 'File', wrap, true);
}

// ---------------- go ----------------
boot();

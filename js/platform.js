// ============================================================
// OpenStoryflow — web platform shim
// Replaces the former Electron preload API. Everything stays
// in the browser: data in IndexedDB, exports as downloads,
// link previews via the /api/link-meta Vercel function.
// ============================================================

(() => {
  // ---------- IndexedDB (single "kv" store, key "db") ----------
  const DB_NAME = 'openstoryflow';
  let idbPromise = null;
  function idb() {
    if (!idbPromise) {
      idbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return idbPromise;
  }
  function kvGet(key) {
    return idb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly').objectStore('kv').get(key);
      tx.onsuccess = () => resolve(tx.result ?? null);
      tx.onerror = () => reject(tx.error);
    }));
  }
  function kvPut(key, value) {
    return idb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite').objectStore('kv').put(value, key);
      tx.onsuccess = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    }));
  }

  // ---------- download helper ----------
  function download(name, blobOrDataUrl) {
    const a = document.createElement('a');
    a.download = name;
    if (typeof blobOrDataUrl === 'string') {
      a.href = blobOrDataUrl;
    } else {
      a.href = URL.createObjectURL(blobOrDataUrl);
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    }
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.api = {
    async load() {
      try { return await kvGet('db'); } catch { return null; }
    },

    async save(data) {
      // structuredClone strips nothing here (plain JSON data), but guard anyway
      return kvPut('db', JSON.parse(JSON.stringify(data)));
    },

    async linkMeta(url) {
      try {
        const res = await fetch('/api/link-meta?url=' + encodeURIComponent(url));
        if (!res.ok) throw new Error('meta ' + res.status);
        return await res.json();
      } catch {
        return { title: url, description: '', image: '' };
      }
    },

    // rect is in screen coordinates (from exportRegionPNG); crop it out of the canvas node
    async exportPNG(rect, name) {
      const node = document.getElementById('canvas');
      const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#141416';
      const PR = 2;
      const canvas = await htmlToImage.toCanvas(node, {
        backgroundColor: bg,
        pixelRatio: PR,
        filter: (el) => !(el.id === 'align-bar' || el.id === 'zoom-indicator' || el.id === 'rubber-band')
      });
      const nb = node.getBoundingClientRect();
      const out = document.createElement('canvas');
      const r = rect || { x: nb.x, y: nb.y, width: nb.width, height: nb.height };
      out.width = Math.round(r.width * PR);
      out.height = Math.round(r.height * PR);
      out.getContext('2d').drawImage(canvas,
        Math.round((r.x - nb.x) * PR), Math.round((r.y - nb.y) * PR), out.width, out.height,
        0, 0, out.width, out.height);
      download((name || 'board') + '.png', out.toDataURL('image/png'));
      return true;
    },

    // open the HTML in a new window and let the user "Save as PDF" via the print dialog
    async exportPDF(html, name) {
      const w = window.open('', '_blank');
      if (!w) return false;
      w.document.write(html + `<script>document.title=${JSON.stringify(name || 'document')};
        window.onload = () => setTimeout(() => window.print(), 300);<\/script>`);
      w.document.close();
      return true;
    },

    async exportText(content, name) {
      download(name || 'export.txt', new Blob([content], { type: 'application/json' }));
      return true;
    },

    async importJSON() {
      return new Promise((resolve) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'application/json,.json';
        inp.onchange = () => {
          const f = inp.files[0];
          if (!f) return resolve(null);
          const r = new FileReader();
          r.onload = () => { try { resolve(JSON.parse(r.result)); } catch { resolve(null); } };
          r.onerror = () => resolve(null);
          r.readAsText(f);
        };
        // cancel: resolve null if dialog closed without change (best effort)
        inp.oncancel = () => resolve(null);
        inp.click();
      });
    }
  };
})();

// OpenStoryflow — Electron main process.
// Fully local: data lives in a JSON file inside the OS userData directory.
const { app, BrowserWindow, ipcMain, dialog, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = () => path.join(app.getPath('userData'), 'openstoryflow-data.json');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 900,
    minHeight: 600,
    title: 'OpenStoryflow',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#111318',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Open external links in the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ---------- persistence ----------
ipcMain.handle('store:load', async () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE(), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('store:save', async (_e, data) => {
  const file = DATA_FILE();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
  return true;
});

// ---------- link metadata (title / description / og:image) ----------
ipcMain.handle('link:meta', async (_e, url) => {
  try {
    const res = await net.fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 OpenStoryflow' } });
    const html = (await res.text()).slice(0, 300000);
    const pick = (re) => { const m = html.match(re); return m ? m[1].trim() : ''; };
    const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    return {
      title: decode(pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || pick(/<title[^>]*>([^<]+)<\/title>/i) || url),
      description: decode(pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i) || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)),
      image: pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
    };
  } catch (err) {
    return { title: url, description: '', image: '', error: String(err) };
  }
});

// ---------- exports ----------
// Capture a screen-space rect of the window as PNG and save it via dialog.
ipcMain.handle('export:png', async (_e, rect, suggestedName) => {
  const image = await win.webContents.capturePage(rect ? {
    x: Math.round(rect.x), y: Math.round(rect.y),
    width: Math.round(rect.width), height: Math.round(rect.height)
  } : undefined);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: (suggestedName || 'board') + '.png',
    filters: [{ name: 'PNG', extensions: ['png'] }]
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, image.toPNG());
  return true;
});

// Render arbitrary HTML into a hidden window and save as PDF (used for Docs and board summaries).
ipcMain.handle('export:pdf', async (_e, html, suggestedName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: (suggestedName || 'document') + '.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return false;
  const hidden = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await hidden.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdf = await hidden.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    fs.writeFileSync(filePath, pdf);
    return true;
  } finally {
    hidden.destroy();
  }
});

// Save arbitrary text (JSON board export etc.).
ipcMain.handle('export:text', async (_e, content, suggestedName, ext) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: suggestedName || 'export.' + (ext || 'txt'),
    filters: [{ name: (ext || 'txt').toUpperCase(), extensions: [ext || 'txt'] }]
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
});

ipcMain.handle('import:json', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile']
  });
  if (canceled || !filePaths[0]) return null;
  try { return JSON.parse(fs.readFileSync(filePaths[0], 'utf8')); } catch { return null; }
});

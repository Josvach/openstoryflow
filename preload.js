const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.invoke('store:save', data),
  linkMeta: (url) => ipcRenderer.invoke('link:meta', url),
  exportPNG: (rect, name) => ipcRenderer.invoke('export:png', rect, name),
  exportPDF: (html, name) => ipcRenderer.invoke('export:pdf', html, name),
  exportText: (content, name, ext) => ipcRenderer.invoke('export:text', content, name, ext),
  importJSON: () => ipcRenderer.invoke('import:json')
});

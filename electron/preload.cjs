const { contextBridge, ipcRenderer } = require('electron');

// 렌더러(React)에서 안전하게 사용할 수 있는 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ── 파일 기반 로컬 캐시 (data.json) ──
  cacheRead: (key) => ipcRenderer.invoke('cache:read', key),
  cacheWrite: (key, value) => ipcRenderer.invoke('cache:write', key, value),
  cacheReadAll: () => ipcRenderer.invoke('cache:read-all'),

  // ── 자동 업데이트 ──
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, version) => callback(version)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, version) => callback(version)),
});

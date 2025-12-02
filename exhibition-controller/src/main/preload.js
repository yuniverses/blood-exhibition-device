const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給渲染進程
contextBridge.exposeInMainWorld('api', {
  // 配置
  getConfig: () => ipcRenderer.invoke('get-config'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),

  // 裝置狀態
  getDeviceStatus: () => ipcRenderer.invoke('get-device-status'),
  getWindowStatus: () => ipcRenderer.invoke('get-window-status'),

  // 後台控制
  startBackend: () => ipcRenderer.invoke('start-backend'),
  stopBackend: () => ipcRenderer.invoke('stop-backend'),

  // 裝置控制
  startDevice: (deviceId) => ipcRenderer.invoke('start-device', deviceId),
  stopDevice: (deviceId) => ipcRenderer.invoke('stop-device', deviceId),
  startAll: () => ipcRenderer.invoke('start-all'),
  stopAll: () => ipcRenderer.invoke('stop-all'),

  // 畫面控制
  openScreen: (options) => ipcRenderer.invoke('open-screen', options),
  closeScreen: (options) => ipcRenderer.invoke('close-screen', options),
  closeAllScreens: () => ipcRenderer.invoke('close-all-screens'),
  moveScreen: (options) => ipcRenderer.invoke('move-screen', options),
  toggleFullscreen: (options) => ipcRenderer.invoke('toggle-fullscreen', options),
  refreshScreen: (options) => ipcRenderer.invoke('refresh-screen', options),

  // 健康檢查
  healthCheck: (deviceId) => ipcRenderer.invoke('health-check', deviceId),

  // 打開外部連結
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // 事件監聽
  onDeviceStatusUpdate: (callback) => {
    ipcRenderer.on('device-status-update', (event, status) => callback(status));
  },
  onDeviceLog: (callback) => {
    ipcRenderer.on('device-log', (event, log) => callback(log));
  },

  // 移除監聽
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('device-status-update');
    ipcRenderer.removeAllListeners('device-log');
  }
});

const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const DeviceManager = require('./deviceManager');
const WindowManager = require('./windowManager');

// 保持對視窗的全局引用
let controlPanel = null;
let deviceManager = null;
let windowManager = null;

function createControlPanel() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  controlPanel = new BrowserWindow({
    width: 1200,
    height: 800,
    x: primaryDisplay.bounds.x + 50,
    y: primaryDisplay.bounds.y + 50,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: '展場控制系統',
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  controlPanel.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 開發模式下開啟 DevTools
  if (process.env.NODE_ENV === 'development') {
    controlPanel.webContents.openDevTools();
  }

  controlPanel.on('closed', () => {
    controlPanel = null;
  });
}

app.whenReady().then(async () => {
  // 初始化管理器
  const configPath = path.join(__dirname, '../../devices.config.json');
  deviceManager = new DeviceManager(configPath);
  windowManager = new WindowManager();

  // 建立控制面板
  createControlPanel();

  // 設定 IPC 通訊
  setupIPC();
});

app.on('window-all-closed', async () => {
  // 停止所有裝置
  if (deviceManager) {
    await deviceManager.stopAll();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (controlPanel === null) {
    createControlPanel();
  }
});

// 應用程式退出前清理
app.on('before-quit', async (event) => {
  if (deviceManager && deviceManager.hasRunningProcesses()) {
    event.preventDefault();
    await deviceManager.stopAll();
    app.quit();
  }
});

function setupIPC() {
  // 取得配置
  ipcMain.handle('get-config', () => {
    return deviceManager.getConfig();
  });

  // 取得所有顯示器資訊
  ipcMain.handle('get-displays', () => {
    return screen.getAllDisplays().map((display, index) => ({
      id: index,
      label: display.label || `顯示器 ${index + 1}`,
      bounds: display.bounds,
      isPrimary: display.bounds.x === 0 && display.bounds.y === 0,
      size: display.size,
      scaleFactor: display.scaleFactor
    }));
  });

  // 取得裝置狀態
  ipcMain.handle('get-device-status', () => {
    return deviceManager.getAllStatus();
  });

  // 啟動後台
  ipcMain.handle('start-backend', async () => {
    return await deviceManager.startBackend();
  });

  // 停止後台
  ipcMain.handle('stop-backend', async () => {
    return await deviceManager.stopBackend();
  });

  // 啟動單個裝置
  ipcMain.handle('start-device', async (event, deviceId) => {
    return await deviceManager.startDevice(deviceId);
  });

  // 停止單個裝置
  ipcMain.handle('stop-device', async (event, deviceId) => {
    return await deviceManager.stopDevice(deviceId);
  });

  // 啟動所有裝置
  ipcMain.handle('start-all', async () => {
    return await deviceManager.startAll();
  });

  // 停止所有裝置
  ipcMain.handle('stop-all', async () => {
    return await deviceManager.stopAll();
  });

  // 開啟畫面視窗
  ipcMain.handle('open-screen', async (event, { deviceId, screenId, displayIndex, fullscreen }) => {
    const device = deviceManager.getDevice(deviceId);
    if (!device) return { success: false, error: '裝置不存在' };

    const screenConfig = device.screens?.find(s => s.id === screenId);
    if (!screenConfig) return { success: false, error: '畫面不存在' };

    // 使用 deviceManager 來組合完整的 URL
    const fullUrl = deviceManager.getScreenUrl(deviceId, screenId);
    if (!fullUrl) return { success: false, error: '無法取得畫面 URL' };

    return windowManager.openScreen({
      deviceId,
      screenId,
      url: fullUrl,
      displayIndex: displayIndex ?? screenConfig.defaultDisplay ?? 0,
      fullscreen: fullscreen ?? true,
      title: `${device.name} - ${screenConfig.name}`
    });
  });

  // 關閉畫面視窗
  ipcMain.handle('close-screen', async (event, { deviceId, screenId }) => {
    return windowManager.closeScreen(deviceId, screenId);
  });

  // 關閉所有畫面視窗
  ipcMain.handle('close-all-screens', async () => {
    return windowManager.closeAll();
  });

  // 取得開啟的視窗狀態
  ipcMain.handle('get-window-status', () => {
    return windowManager.getStatus();
  });

  // 移動視窗到指定顯示器
  ipcMain.handle('move-screen', async (event, { deviceId, screenId, displayIndex }) => {
    return windowManager.moveToDisplay(deviceId, screenId, displayIndex);
  });

  // 切換全螢幕
  ipcMain.handle('toggle-fullscreen', async (event, { deviceId, screenId }) => {
    return windowManager.toggleFullscreen(deviceId, screenId);
  });

  // 重新整理畫面
  ipcMain.handle('refresh-screen', async (event, { deviceId, screenId }) => {
    return windowManager.refreshScreen(deviceId, screenId);
  });

  // 健康檢查
  ipcMain.handle('health-check', async (event, deviceId) => {
    if (deviceId === 'backend') {
      return await deviceManager.checkBackendHealth();
    }
    return await deviceManager.checkDeviceHealth(deviceId);
  });

  // 打開外部連結
  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 訂閱裝置狀態更新
  deviceManager.on('status-update', (status) => {
    if (controlPanel && !controlPanel.isDestroyed()) {
      controlPanel.webContents.send('device-status-update', status);
    }
  });

  // 訂閱日誌
  deviceManager.on('log', (log) => {
    if (controlPanel && !controlPanel.isDestroyed()) {
      controlPanel.webContents.send('device-log', log);
    }
  });
}

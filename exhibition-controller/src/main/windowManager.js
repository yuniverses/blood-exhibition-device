const { BrowserWindow, screen } = require('electron');

class WindowManager {
  constructor() {
    this.windows = new Map(); // key: `${deviceId}-${screenId}`
  }

  getKey(deviceId, screenId) {
    return `${deviceId}-${screenId}`;
  }

  openScreen({ deviceId, screenId, url, displayIndex, fullscreen, title }) {
    const key = this.getKey(deviceId, screenId);

    // 如果視窗已存在，聚焦並返回
    if (this.windows.has(key)) {
      const existingWindow = this.windows.get(key);
      if (!existingWindow.isDestroyed()) {
        existingWindow.focus();
        return { success: true, message: '視窗已存在，已聚焦' };
      }
    }

    try {
      const displays = screen.getAllDisplays();
      const targetDisplay = displays[displayIndex] || displays[0];

      const windowOptions = {
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        fullscreen: fullscreen,
        frame: !fullscreen,
        autoHideMenuBar: true,
        title: title || `${deviceId} - ${screenId}`,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      };

      const win = new BrowserWindow(windowOptions);

      // 載入 URL
      win.loadURL(url);

      // 監聽關閉事件
      win.on('closed', () => {
        this.windows.delete(key);
      });

      this.windows.set(key, win);

      return {
        success: true,
        windowId: key,
        displayIndex: displayIndex
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  closeScreen(deviceId, screenId) {
    const key = this.getKey(deviceId, screenId);
    const win = this.windows.get(key);

    if (win && !win.isDestroyed()) {
      win.close();
      this.windows.delete(key);
      return { success: true };
    }

    return { success: true, message: '視窗不存在或已關閉' };
  }

  closeAll() {
    for (const [key, win] of this.windows) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }
    this.windows.clear();
    return { success: true };
  }

  moveToDisplay(deviceId, screenId, displayIndex) {
    const key = this.getKey(deviceId, screenId);
    const win = this.windows.get(key);

    if (!win || win.isDestroyed()) {
      return { success: false, error: '視窗不存在' };
    }

    const displays = screen.getAllDisplays();
    const targetDisplay = displays[displayIndex];

    if (!targetDisplay) {
      return { success: false, error: '目標顯示器不存在' };
    }

    const wasFullscreen = win.isFullScreen();

    // 如果是全螢幕，先退出
    if (wasFullscreen) {
      win.setFullScreen(false);
    }

    // 移動視窗
    win.setBounds({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height
    });

    // 如果之前是全螢幕，恢復全螢幕
    if (wasFullscreen) {
      win.setFullScreen(true);
    }

    return { success: true, displayIndex };
  }

  toggleFullscreen(deviceId, screenId) {
    const key = this.getKey(deviceId, screenId);
    const win = this.windows.get(key);

    if (!win || win.isDestroyed()) {
      return { success: false, error: '視窗不存在' };
    }

    const isFullscreen = win.isFullScreen();
    win.setFullScreen(!isFullscreen);

    return { success: true, fullscreen: !isFullscreen };
  }

  refreshScreen(deviceId, screenId) {
    const key = this.getKey(deviceId, screenId);
    const win = this.windows.get(key);

    if (!win || win.isDestroyed()) {
      return { success: false, error: '視窗不存在' };
    }

    win.reload();
    return { success: true };
  }

  getStatus() {
    const status = [];
    for (const [key, win] of this.windows) {
      if (!win.isDestroyed()) {
        const [deviceId, screenId] = key.split('-');
        const bounds = win.getBounds();
        const displays = screen.getAllDisplays();

        // 找出視窗所在的顯示器
        let displayIndex = 0;
        for (let i = 0; i < displays.length; i++) {
          const display = displays[i];
          if (bounds.x >= display.bounds.x &&
              bounds.x < display.bounds.x + display.bounds.width) {
            displayIndex = i;
            break;
          }
        }

        status.push({
          key,
          deviceId,
          screenId,
          isFullscreen: win.isFullScreen(),
          displayIndex,
          bounds
        });
      }
    }
    return status;
  }
}

module.exports = WindowManager;

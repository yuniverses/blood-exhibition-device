// 展場控制系統前端邏輯
class ExhibitionController {
  constructor() {
    this.config = null;
    this.displays = [];
    this.deviceStatus = {};
    this.windowStatus = [];

    this.init();
  }

  async init() {
    // 載入配置和狀態（順序很重要！）
    await this.loadConfig();
    await this.loadDisplays();

    // 在顯示器資料載入後才渲染裝置
    this.renderDevices();

    await this.refreshStatus();

    // 設定事件監聽
    this.setupEventListeners();

    // 訂閱即時更新
    this.subscribeToUpdates();

    // 定時刷新狀態
    setInterval(() => this.refreshStatus(), 5000);
  }

  async loadConfig() {
    try {
      this.config = await window.api.getConfig();
      // 移除這裡的 renderDevices()，改在 init() 中呼叫
    } catch (error) {
      this.log('系統', `載入配置失敗: ${error.message}`, 'stderr');
    }
  }

  async loadDisplays() {
    try {
      this.displays = await window.api.getDisplays();
      this.renderDisplays();
    } catch (error) {
      this.log('系統', `載入顯示器資訊失敗: ${error.message}`, 'stderr');
    }
  }

  async refreshStatus() {
    try {
      const status = await window.api.getDeviceStatus();
      this.deviceStatus = status;
      this.updateBackendUI(status.backend);
      this.updateDevicesUI(status.devices);

      const windowStatus = await window.api.getWindowStatus();
      this.windowStatus = windowStatus;
      this.renderOpenWindows();
    } catch (error) {
      console.error('刷新狀態失敗:', error);
    }
  }

  setupEventListeners() {
    // 打開 API 文檔
    document.getElementById('openApiDocsBtn').addEventListener('click', async () => {
      try {
        const result = await window.api.openExternal('http://localhost:3000');
        if (!result.success) {
          this.log('系統', `開啟 API 文檔失敗: ${result.error}`, 'stderr');
        }
      } catch (error) {
        this.log('系統', `開啟 API 文檔失敗: ${error.message}`, 'stderr');
      }
    });

    // 全部啟動
    document.getElementById('startAllBtn').addEventListener('click', async () => {
      this.log('系統', '正在啟動所有服務...');
      const btn = document.getElementById('startAllBtn');
      btn.disabled = true;
      btn.textContent = '啟動中...';

      try {
        const result = await window.api.startAll();
        if (result.backend?.success) {
          this.log('系統', '後台啟動成功');
        } else if (result.backend?.error) {
          this.log('系統', `後台啟動失敗: ${result.backend.error}`, 'stderr');
        }

        for (const device of result.devices || []) {
          if (device.success) {
            this.log('系統', `裝置 ${device.id} 啟動成功`);
          } else if (device.error) {
            this.log('系統', `裝置 ${device.id} 啟動失敗: ${device.error}`, 'stderr');
          }
        }
      } catch (error) {
        this.log('系統', `啟動失敗: ${error.message}`, 'stderr');
      }

      btn.disabled = false;
      btn.textContent = '全部啟動';
      await this.refreshStatus();
    });

    // 全部停止
    document.getElementById('stopAllBtn').addEventListener('click', async () => {
      this.log('系統', '正在停止所有服務...');

      // 先關閉所有畫面
      await window.api.closeAllScreens();

      await window.api.stopAll();
      this.log('系統', '所有服務已停止');
      await this.refreshStatus();
    });

    // 啟動後台
    document.getElementById('startBackendBtn').addEventListener('click', async () => {
      this.log('系統', '正在啟動後台...');
      const btn = document.getElementById('startBackendBtn');
      btn.disabled = true;
      btn.textContent = '啟動中...';

      try {
        const result = await window.api.startBackend();
        if (result.success) {
          this.log('系統', '後台啟動成功');
        } else {
          this.log('系統', `後台啟動失敗: ${result.error}`, 'stderr');
        }
      } catch (error) {
        this.log('系統', `後台啟動失敗: ${error.message}`, 'stderr');
      }

      btn.disabled = false;
      btn.textContent = '啟動';
      await this.refreshStatus();
    });

    // 停止後台
    document.getElementById('stopBackendBtn').addEventListener('click', async () => {
      this.log('系統', '正在停止後台...');
      await window.api.stopBackend();
      this.log('系統', '後台已停止');
      await this.refreshStatus();
    });

    // 重新整理顯示器
    document.getElementById('refreshDisplaysBtn').addEventListener('click', async () => {
      await this.loadDisplays();
      this.log('系統', '顯示器資訊已更新');
    });

    // 關閉所有畫面
    document.getElementById('closeAllScreensBtn').addEventListener('click', async () => {
      await window.api.closeAllScreens();
      this.log('系統', '已關閉所有畫面');
      await this.refreshStatus();
    });

    // 清除日誌
    document.getElementById('clearLogBtn').addEventListener('click', () => {
      document.getElementById('logContainer').innerHTML = '';
      this.log('系統', '日誌已清除');
    });
  }

  subscribeToUpdates() {
    // 裝置狀態更新
    window.api.onDeviceStatusUpdate((status) => {
      if (status.id === 'backend') {
        this.deviceStatus.backend = status.status;
        this.updateBackendUI(status.status);
      } else {
        const index = this.deviceStatus.devices?.findIndex(d => d.id === status.id);
        if (index >= 0) {
          this.deviceStatus.devices[index] = status.status;
        }
        this.updateSingleDeviceUI(status.id, status.status);
      }
    });

    // 日誌更新
    window.api.onDeviceLog((log) => {
      this.log(log.source, log.message, log.type);
    });
  }

  updateBackendUI(status) {
    if (!status) return;

    const card = document.getElementById('backendCard');
    const indicator = document.getElementById('backendIndicator');
    const icon = document.getElementById('backendIcon');
    const statusText = document.getElementById('backendStatus');
    const startBtn = document.getElementById('startBackendBtn');
    const stopBtn = document.getElementById('stopBackendBtn');

    // 更新狀態指示器
    indicator.className = 'status-indicator ' + status.status;
    card.className = 'backend-card' + (status.healthy ? ' healthy' : '');

    // 更新圖示
    if (status.status === 'running' && status.healthy) {
      icon.textContent = '✓';
    } else if (status.status === 'starting') {
      icon.textContent = '◌';
    } else if (status.status === 'error') {
      icon.textContent = '✕';
    } else {
      icon.textContent = '⏹';
    }

    // 更新狀態文字
    const statusMap = {
      running: '運行中',
      stopped: '已停止',
      starting: '啟動中',
      error: '錯誤'
    };
    let statusStr = `狀態：${statusMap[status.status] || status.status}`;
    if (status.healthy) statusStr += ' (健康)';
    if (status.error) statusStr += ` | 錯誤: ${status.error}`;
    statusStr += ` | Port: ${status.port}`;
    statusText.textContent = statusStr;

    // 更新按鈕狀態
    startBtn.disabled = status.status === 'running' || status.status === 'starting';
    stopBtn.disabled = status.status === 'stopped';
  }

  updateDevicesUI(devices) {
    if (!devices) return;

    for (const device of devices) {
      this.updateSingleDeviceUI(device.id, device);
    }
  }

  updateSingleDeviceUI(deviceId, status) {
    const statusEl = document.querySelector(`[data-device-id="${deviceId}"] .device-status`);
    const startBtn = document.querySelector(`[data-device-id="${deviceId}"] .start-device-btn`);
    const stopBtn = document.querySelector(`[data-device-id="${deviceId}"] .stop-device-btn`);

    if (statusEl) {
      statusEl.className = 'device-status ' + status.status;
    }

    if (startBtn) {
      startBtn.disabled = status.status === 'running' || status.status === 'starting' || !status.enabled;
    }

    if (stopBtn) {
      stopBtn.disabled = status.status === 'stopped' || !status.enabled;
    }

    // 更新畫面開啟按鈕
    const screenBtns = document.querySelectorAll(`[data-device-id="${deviceId}"] .open-screen-btn`);
    screenBtns.forEach(btn => {
      btn.disabled = status.status !== 'running';
    });
  }

  renderDisplays() {
    const container = document.getElementById('displaysContainer');
    container.innerHTML = '';

    this.displays.forEach((display, index) => {
      const el = document.createElement('div');
      el.className = 'display-item';
      el.innerHTML = `
        <div class="display-icon">${display.isPrimary ? '🖥️' : '📺'}</div>
        <div class="display-info">
          <h4>顯示器 ${index}${display.isPrimary ? ' (主螢幕)' : ''}</h4>
          <p>${display.size.width} × ${display.size.height} | 縮放: ${display.scaleFactor}x</p>
        </div>
      `;
      container.appendChild(el);
    });
  }

  renderDevices() {
    const grid = document.getElementById('devicesGrid');
    grid.innerHTML = '';

    if (!this.config?.devices) return;

    for (const device of this.config.devices) {
      const card = this.createDeviceCard(device);
      grid.appendChild(card);
    }
  }

  createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card' + (device.enabled === false ? ' disabled' : '');
    card.dataset.deviceId = device.id;

    const screensHTML = device.screens?.map(screen => `
      <div class="screen-item" data-screen-id="${screen.id}">
        <div class="screen-info">
          <div class="screen-name">${screen.name}</div>
          <div class="screen-description">${screen.description || ''}</div>
        </div>
        <div class="screen-controls">
          <select class="display-select" data-screen-id="${screen.id}">
            ${this.displays.map((d, i) => `
              <option value="${i}" ${screen.defaultDisplay === i ? 'selected' : ''}>
                顯示器 ${i}${d.isPrimary ? ' (主)' : ''}
              </option>
            `).join('')}
          </select>
          <button class="btn btn-primary btn-sm open-screen-btn"
                  data-screen-id="${screen.id}"
                  disabled>
            開啟
          </button>
        </div>
      </div>
    `).join('') || '<div class="empty-message">無可用畫面</div>';

    card.innerHTML = `
      <div class="device-header">
        <div class="device-info">
          <div class="device-status stopped"></div>
          <span class="device-name">${device.name}</span>
        </div>
        <span class="device-port">Port: ${device.port}</span>
      </div>
      <div class="device-body">
        <div class="device-description">${device.description || ''}</div>
        <div class="screens-list">
          ${screensHTML}
        </div>
      </div>
      <div class="device-footer">
        <button class="btn btn-success btn-sm start-device-btn" ${device.enabled === false ? 'disabled' : ''}>
          啟動裝置
        </button>
        <button class="btn btn-danger btn-sm stop-device-btn" disabled>
          停止裝置
        </button>
      </div>
    `;

    // 綁定事件
    const startBtn = card.querySelector('.start-device-btn');
    const stopBtn = card.querySelector('.stop-device-btn');

    startBtn.addEventListener('click', async () => {
      this.log('系統', `正在啟動 ${device.name}...`);
      startBtn.disabled = true;
      startBtn.textContent = '啟動中...';

      const result = await window.api.startDevice(device.id);
      if (result.success) {
        this.log('系統', `${device.name} 啟動成功`);
      } else {
        this.log('系統', `${device.name} 啟動失敗: ${result.error}`, 'stderr');
      }

      startBtn.textContent = '啟動裝置';
      await this.refreshStatus();
    });

    stopBtn.addEventListener('click', async () => {
      this.log('系統', `正在停止 ${device.name}...`);
      await window.api.stopDevice(device.id);
      this.log('系統', `${device.name} 已停止`);
      await this.refreshStatus();
    });

    // 畫面開啟按鈕事件
    const screenBtns = card.querySelectorAll('.open-screen-btn');
    screenBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const screenId = btn.dataset.screenId;
        const displaySelect = card.querySelector(`select[data-screen-id="${screenId}"]`);
        const displayIndex = parseInt(displaySelect.value, 10);

        this.log('系統', `開啟 ${device.name} - ${screenId} 在顯示器 ${displayIndex}`);

        const result = await window.api.openScreen({
          deviceId: device.id,
          screenId: screenId,
          displayIndex: displayIndex,
          fullscreen: true
        });

        if (result.success) {
          this.log('系統', `畫面已開啟`);
        } else {
          this.log('系統', `開啟失敗: ${result.error}`, 'stderr');
        }

        await this.refreshStatus();
      });
    });

    return card;
  }

  renderOpenWindows() {
    const container = document.getElementById('openWindows');

    if (!this.windowStatus || this.windowStatus.length === 0) {
      container.innerHTML = '<span class="empty-message">尚無開啟的畫面</span>';
      return;
    }

    container.innerHTML = '';

    for (const win of this.windowStatus) {
      const tag = document.createElement('div');
      tag.className = 'window-tag';
      tag.innerHTML = `
        <span>${win.deviceId} - ${win.screenId}</span>
        <span style="color: rgba(255,255,255,0.5)">顯示器 ${win.displayIndex}</span>
        <button class="close-btn" data-device-id="${win.deviceId}" data-screen-id="${win.screenId}">✕</button>
      `;

      tag.querySelector('.close-btn').addEventListener('click', async () => {
        await window.api.closeScreen({
          deviceId: win.deviceId,
          screenId: win.screenId
        });
        this.log('系統', `已關閉 ${win.deviceId} - ${win.screenId}`);
        await this.refreshStatus();
      });

      container.appendChild(tag);
    }
  }

  log(source, message, type = 'stdout') {
    const container = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const cleanMessage = message.replace(/\n/g, ' ').trim();

    entry.innerHTML = `<span style="color: rgba(255,255,255,0.4)">[${time}]</span> <span class="log-source">[${source}]</span>${cleanMessage}`;
    container.appendChild(entry);

    // 自動滾動到底部
    container.scrollTop = container.scrollHeight;

    // 限制日誌數量
    while (container.children.length > 500) {
      container.removeChild(container.firstChild);
    }
  }
}

// 啟動應用
const app = new ExhibitionController();

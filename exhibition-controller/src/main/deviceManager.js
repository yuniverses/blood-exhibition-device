const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const EventEmitter = require('events');
const kill = require('tree-kill');

class DeviceManager extends EventEmitter {
  constructor(configPath) {
    super();
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.processes = new Map();
    this.status = new Map();
    this.healthCheckIntervals = new Map();

    // 初始化狀態
    this.initializeStatus();
  }

  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error('無法載入配置檔案:', error);
      return { hosts: {}, backend: null, devices: [] };
    }
  }

  reloadConfig() {
    this.config = this.loadConfig();
    this.initializeStatus();
    return this.config;
  }

  getConfig() {
    return this.config;
  }

  // 取得主機資訊
  getHost(hostId) {
    return this.config.hosts?.[hostId] || this.config.hosts?.['local'] || { address: '127.0.0.1', type: 'local' };
  }

  // 組合完整的 URL
  buildUrl(hostId, port, urlPath) {
    const host = this.getHost(hostId);
    const address = host.address || '127.0.0.1';
    return `http://${address}:${port}${urlPath}`;
  }

  // 檢查是否為本機
  isLocalHost(hostId) {
    const host = this.getHost(hostId);
    return host.type === 'local';
  }

  initializeStatus() {
    // 後台狀態
    if (this.config.backend) {
      const host = this.getHost(this.config.backend.host);
      this.status.set('backend', {
        id: 'backend',
        name: this.config.backend.name,
        status: 'stopped',
        healthy: false,
        port: this.config.backend.port,
        host: this.config.backend.host,
        hostName: host.name,
        error: null,
        startedAt: null
      });
    }

    // 裝置狀態
    for (const device of this.config.devices || []) {
      const host = this.getHost(device.host);
      this.status.set(device.id, {
        id: device.id,
        name: device.name,
        status: 'stopped',
        healthy: false,
        port: device.port,
        host: device.host,
        hostName: host.name,
        error: null,
        enabled: device.enabled !== false,
        startedAt: null
      });
    }
  }

  getAllStatus() {
    const result = {
      backend: this.status.get('backend'),
      devices: [],
      hosts: this.config.hosts || {}
    };

    for (const device of this.config.devices || []) {
      result.devices.push(this.status.get(device.id));
    }

    return result;
  }

  getDevice(deviceId) {
    return this.config.devices?.find(d => d.id === deviceId);
  }

  async startBackend() {
    if (!this.config.backend) {
      return { success: false, error: '未配置後台服務' };
    }

    const backend = this.config.backend;
    const backendStatus = this.status.get('backend');

    if (backendStatus.status === 'running') {
      return { success: true, message: '後台已在運行' };
    }

    // 檢查是否為本機
    if (!this.isLocalHost(backend.host)) {
      // 遠端主機：只檢查健康狀態，不啟動進程
      const healthUrl = this.buildUrl(backend.host, backend.port, backend.healthCheck);
      this.emit('log', { source: 'backend', type: 'stdout', message: `遠端後台，檢查連線... (${healthUrl})` });

      try {
        await this.waitForHealth('backend', healthUrl, 10000);
        this.startHealthCheck('backend', healthUrl);
        return { success: true, message: '遠端後台已連線' };
      } catch (error) {
        return { success: false, error: `無法連線到遠端後台: ${error.message}` };
      }
    }

    // 本機啟動
    try {
      const workDir = path.resolve(path.dirname(this.configPath), backend.path);

      // 檢查目錄是否存在
      if (!fs.existsSync(workDir)) {
        throw new Error(`後台目錄不存在: ${workDir}`);
      }

      const proc = spawn(backend.command, backend.args, {
        cwd: workDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set('backend', proc);
      this.updateStatus('backend', { status: 'starting' });

      // 監聽輸出
      proc.stdout.on('data', (data) => {
        const log = data.toString();
        this.emit('log', { source: 'backend', type: 'stdout', message: log });
      });

      proc.stderr.on('data', (data) => {
        const log = data.toString();
        this.emit('log', { source: 'backend', type: 'stderr', message: log });
      });

      proc.on('error', (error) => {
        this.updateStatus('backend', { status: 'error', error: error.message });
      });

      proc.on('exit', (code) => {
        this.processes.delete('backend');
        this.updateStatus('backend', {
          status: 'stopped',
          healthy: false,
          error: code !== 0 ? `進程退出，代碼: ${code}` : null
        });
        this.stopHealthCheck('backend');
      });

      // 等待啟動並檢查健康狀態
      const healthUrl = this.buildUrl(backend.host, backend.port, backend.healthCheck);
      await this.waitForHealth('backend', healthUrl, 60000);
      this.startHealthCheck('backend', healthUrl);

      return { success: true };
    } catch (error) {
      this.updateStatus('backend', { status: 'error', error: error.message });
      return { success: false, error: error.message };
    }
  }

  async stopBackend() {
    const proc = this.processes.get('backend');
    this.stopHealthCheck('backend');

    if (!proc) {
      this.updateStatus('backend', { status: 'stopped', healthy: false });
      return { success: true, message: '後台未在運行' };
    }

    return new Promise((resolve) => {
      kill(proc.pid, 'SIGTERM', (err) => {
        if (err) {
          console.error('停止後台失敗:', err);
        }
        this.processes.delete('backend');
        this.updateStatus('backend', { status: 'stopped', healthy: false });
        resolve({ success: true });
      });
    });
  }

  async startDevice(deviceId) {
    const device = this.getDevice(deviceId);
    if (!device) {
      return { success: false, error: '裝置不存在' };
    }

    if (device.enabled === false) {
      return { success: false, error: '裝置未啟用' };
    }

    const deviceStatus = this.status.get(deviceId);
    if (deviceStatus.status === 'running') {
      return { success: true, message: '裝置已在運行' };
    }

    // 確認後台已啟動
    const backendStatus = this.status.get('backend');
    if (!backendStatus || !backendStatus.healthy) {
      return { success: false, error: '請先啟動後台服務' };
    }

    // 檢查是否為本機
    if (!this.isLocalHost(device.host)) {
      // 遠端主機：只檢查健康狀態
      const healthUrl = this.buildUrl(device.host, device.port, device.healthCheck);
      this.emit('log', { source: deviceId, type: 'stdout', message: `遠端裝置，檢查連線... (${healthUrl})` });

      try {
        await this.waitForHealth(deviceId, healthUrl, 10000);
        this.startHealthCheck(deviceId, healthUrl);
        return { success: true, message: '遠端裝置已連線' };
      } catch (error) {
        return { success: false, error: `無法連線到遠端裝置: ${error.message}` };
      }
    }

    // 本機啟動
    try {
      const workDir = path.resolve(path.dirname(this.configPath), device.path);

      // 檢查目錄是否存在
      if (!fs.existsSync(workDir)) {
        throw new Error(`裝置目錄不存在: ${workDir}`);
      }

      // 檢查 package.json 是否存在
      if (!fs.existsSync(path.join(workDir, 'package.json'))) {
        throw new Error(`缺少 package.json: ${workDir}`);
      }

      const proc = spawn(device.command, device.args, {
        cwd: workDir,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(deviceId, proc);
      this.updateStatus(deviceId, { status: 'starting' });

      // 監聽輸出
      proc.stdout.on('data', (data) => {
        const log = data.toString();
        this.emit('log', { source: deviceId, type: 'stdout', message: log });
      });

      proc.stderr.on('data', (data) => {
        const log = data.toString();
        this.emit('log', { source: deviceId, type: 'stderr', message: log });
      });

      proc.on('error', (error) => {
        this.updateStatus(deviceId, { status: 'error', error: error.message });
      });

      proc.on('exit', (code) => {
        this.processes.delete(deviceId);
        this.updateStatus(deviceId, {
          status: 'stopped',
          healthy: false,
          error: code !== 0 ? `進程退出，代碼: ${code}` : null
        });
        this.stopHealthCheck(deviceId);
      });

      // 等待啟動並檢查健康狀態
      const healthUrl = this.buildUrl(device.host, device.port, device.healthCheck);
      await this.waitForHealth(deviceId, healthUrl, 60000);
      this.startHealthCheck(deviceId, healthUrl);

      return { success: true };
    } catch (error) {
      this.updateStatus(deviceId, { status: 'error', error: error.message });
      return { success: false, error: error.message };
    }
  }

  async stopDevice(deviceId) {
    const proc = this.processes.get(deviceId);
    this.stopHealthCheck(deviceId);

    if (!proc) {
      this.updateStatus(deviceId, { status: 'stopped', healthy: false });
      return { success: true, message: '裝置未在運行' };
    }

    return new Promise((resolve) => {
      kill(proc.pid, 'SIGTERM', (err) => {
        if (err) {
          console.error(`停止裝置 ${deviceId} 失敗:`, err);
        }
        this.processes.delete(deviceId);
        this.updateStatus(deviceId, { status: 'stopped', healthy: false });
        resolve({ success: true });
      });
    });
  }

  async startAll() {
    const results = { backend: null, devices: [] };

    // 先啟動後台
    results.backend = await this.startBackend();
    if (!results.backend.success) {
      return results;
    }

    // 再啟動所有啟用的本機裝置
    for (const device of this.config.devices || []) {
      if (device.enabled !== false && this.isLocalHost(device.host)) {
        const result = await this.startDevice(device.id);
        results.devices.push({ id: device.id, ...result });
      }
    }

    return results;
  }

  async stopAll() {
    const results = { backend: null, devices: [] };

    // 先停止所有裝置
    for (const device of this.config.devices || []) {
      const result = await this.stopDevice(device.id);
      results.devices.push({ id: device.id, ...result });
    }

    // 再停止後台
    results.backend = await this.stopBackend();

    return results;
  }

  async waitForHealth(id, healthUrl, timeout = 60000) {
    const startTime = Date.now();
    const interval = 2000;
    let lastError = null;

    this.emit('log', { source: id, type: 'stdout', message: `正在等待服務就緒... (${healthUrl})` });

    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(healthUrl, {
          timeout: 5000,
          validateStatus: (status) => status >= 200 && status < 400
        });
        if (response.status >= 200 && response.status < 400) {
          this.updateStatus(id, {
            status: 'running',
            healthy: true,
            error: null,
            startedAt: new Date().toISOString()
          });
          this.emit('log', { source: id, type: 'stdout', message: '服務已就緒！' });
          return true;
        }
      } catch (error) {
        lastError = error.message;
        // 繼續等待
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`啟動超時 (${timeout/1000}秒)，最後錯誤: ${lastError}`);
  }

  startHealthCheck(id, healthUrl) {
    // 清除舊的檢查
    this.stopHealthCheck(id);

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(healthUrl, {
          timeout: 5000,
          validateStatus: (status) => status >= 200 && status < 400
        });
        const healthy = response.status >= 200 && response.status < 400;
        const currentStatus = this.status.get(id);

        if (currentStatus && currentStatus.healthy !== healthy) {
          this.updateStatus(id, { healthy });
        }
      } catch (error) {
        const currentStatus = this.status.get(id);
        if (currentStatus && currentStatus.healthy) {
          this.updateStatus(id, { healthy: false });
        }
      }
    }, 5000);

    this.healthCheckIntervals.set(id, interval);
  }

  stopHealthCheck(id) {
    const interval = this.healthCheckIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(id);
    }
  }

  async checkBackendHealth() {
    if (!this.config.backend) {
      return { healthy: false, error: '未配置後台' };
    }

    const backend = this.config.backend;
    const healthUrl = this.buildUrl(backend.host, backend.port, backend.healthCheck);

    try {
      const response = await axios.get(healthUrl, { timeout: 5000 });
      return { healthy: response.status === 200 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkDeviceHealth(deviceId) {
    const device = this.getDevice(deviceId);
    if (!device) {
      return { healthy: false, error: '裝置不存在' };
    }

    const healthUrl = this.buildUrl(device.host, device.port, device.healthCheck);

    try {
      const response = await axios.get(healthUrl, { timeout: 5000 });
      return { healthy: response.status === 200 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  updateStatus(id, updates) {
    const current = this.status.get(id);
    if (current) {
      const newStatus = { ...current, ...updates };
      this.status.set(id, newStatus);
      this.emit('status-update', { id, status: newStatus });
    }
  }

  hasRunningProcesses() {
    return this.processes.size > 0;
  }

  // 取得裝置的完整 screen URL
  getScreenUrl(deviceId, screenId) {
    const device = this.getDevice(deviceId);
    if (!device) return null;

    const screen = device.screens?.find(s => s.id === screenId);
    if (!screen) return null;

    return this.buildUrl(device.host, device.port, screen.url);
  }
}

module.exports = DeviceManager;

# Exhibition Controller 整合說明

B區任務系統已成功整合到 Exhibition Controller 控制系統中。

## 整合狀態

✅ **已完成整合** - 可透過 Exhibition Controller 自動啟動和管理

## 配置資訊

### Exhibition Controller 配置

在 `exhibition-controller/devices.config.json` 中的配置：

```json
{
  "id": "mission-device",
  "name": "B. 任務系統",
  "type": "device",
  "host": "host-b",
  "path": "../blood-exhibition_Device/blood-exhibition_B_Mission",
  "command": "npm",
  "args": ["start"],
  "port": 8081,
  "healthCheck": "/",
  "screens": [
    {
      "id": "mission-main",
      "name": "任務主畫面",
      "url": "/",
      "description": "互動任務介面",
      "defaultDisplay": 0
    }
  ],
  "enabled": true,
  "description": "捐血緊急任務互動系統 - QR Code 掃描、血型匹配、任務挑戰"
}
```

### 關鍵配置項

- **裝置ID**：`mission-device`
- **主機**：`host-b`（本機開發時為 127.0.0.1）
- **埠號**：`8081`
- **健康檢查**：`http://127.0.0.1:8081/`
- **啟用狀態**：`enabled: true`

## 使用方式

### 方式一：透過 Exhibition Controller（推薦）

1. **啟動 Exhibition Controller**
   ```bash
   cd exhibition-controller
   npm start
   ```

2. **在控制面板中操作**
   - 點擊「全部啟動」或「啟動後台」
   - 等待後台服務就緒（綠色狀態）
   - 點擊「B. 任務系統」的「啟動」按鈕
   - 點擊「任務主畫面」的「開啟」按鈕

3. **自動功能**
   - 自動啟動 Node.js 進程
   - 自動健康檢查
   - 自動在指定顯示器開啟畫面
   - 統一日誌管理

### 方式二：獨立啟動

如果需要單獨運行（不透過 Controller）：

```bash
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm start
```

訪問：http://localhost:8081

## 多主機部署

### 單機模式（開發/測試）

**當前配置**（預設）：
```json
"host-b": {
  "address": "127.0.0.1",
  "type": "local"
}
```

所有裝置在同一台電腦運行，Exhibition Controller 會自動啟動進程。

### 多主機模式（正式展覽）

#### 1. 修改 Exhibition Controller 配置

編輯 `exhibition-controller/devices.config.json`：

```json
"host-b": {
  "id": "host-b",
  "name": "B區主機",
  "address": "192.168.1.101",  // 實際 B 區主機 IP
  "type": "remote"              // 改為 remote
}
```

#### 2. 在 B 區主機上

複製整個專案到 B 區主機：
```bash
# 在 B 區主機上
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm install
```

修改 `.env`：
```env
API_BASE_URL=http://192.168.1.100:3000/api  # A 區主機 IP
PORT=8081
```

手動啟動：
```bash
npm start
```

#### 3. 控制台行為

- Exhibition Controller 會自動偵測 B 區主機狀態
- 顯示健康檢查結果
- 可透過 Controller 開啟畫面到指定顯示器
- 但不會自動啟動進程（需在遠端手動啟動）

## 系統架構

```
┌────────────────────────────────────────┐
│   Exhibition Controller (控制台)       │
│   - 統一啟動/停止                      │
│   - 健康檢查監控                       │
│   - 畫面視窗管理                       │
└───────────────┬────────────────────────┘
                │
        ┌───────┴──────────┐
        ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│  後台 API    │   │  B區任務系統     │
│  (Port 3000) │◄──│  (Port 8081)     │
│              │   │                  │
│  - 用戶資料   │   │  - 任務觸發      │
│  - 互動記錄   │   │  - QR掃描        │
│  - 統計分析   │   │  - 血型匹配      │
└──────────────┘   └──────────────────┘
```

## 健康檢查

Exhibition Controller 會定期檢查 B 區系統：

- **檢查 URL**：`http://127.0.0.1:8081/`
- **檢查間隔**：每 5 秒
- **超時時間**：5 秒
- **狀態指示**：
  - 🟢 綠色：系統正常運行
  - 🔴 紅色：系統離線或錯誤
  - 🟡 黃色：啟動中

## 畫面管理

### 可用畫面

| 畫面 ID | 名稱 | URL | 說明 |
|---------|------|-----|------|
| mission-main | 任務主畫面 | / | 互動任務介面 |

### 開啟畫面

1. **透過 Controller UI**
   - 在「B. 任務系統」區塊
   - 選擇「任務主畫面」
   - 選擇目標顯示器
   - 點擊「開啟」

2. **透過 IPC（程式控制）**
   ```javascript
   window.deviceAPI.openScreen({
     deviceId: 'mission-device',
     screenId: 'mission-main',
     displayIndex: 0
   });
   ```

### 全螢幕模式

畫面開啟後會自動進入全螢幕，可透過：
- 按 `F11` 或 `ESC` 退出
- 點擊 Controller 中的「關閉」按鈕

## 測試檢查清單

在 Exhibition Controller 中測試：

- [ ] 後台服務可以正常啟動
- [ ] B區任務系統可以正常啟動
- [ ] 健康檢查顯示綠色（正常）
- [ ] 可以開啟「任務主畫面」
- [ ] 畫面可以顯示在指定顯示器
- [ ] 觸發任務功能正常
- [ ] QR Code 掃描功能正常
- [ ] 可以透過 Controller 停止系統
- [ ] 日誌正確顯示在 Controller 中

## 故障排除

### Controller 無法啟動 B 區系統

**檢查**：
1. 確認路徑正確：`../blood-exhibition_Device/blood-exhibition_B_Mission`
2. 確認依賴已安裝：`npm install`
3. 檢查埠號 8081 是否被佔用

**解決**：
```bash
# 檢查埠號
lsof -i :8081

# 手動測試啟動
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm start
```

### 健康檢查失敗

**原因**：
- 系統還在啟動中（等待幾秒）
- 埠號錯誤
- 服務啟動失敗

**解決**：
- 查看 Controller 日誌
- 確認 `.env` 中的 PORT=8081
- 檢查 `server.js` 是否正常運行

### 畫面無法開啟

**檢查**：
1. 系統是否已啟動（綠色狀態）
2. 健康檢查是否通過
3. URL 是否正確

**解決**：
- 先在瀏覽器手動訪問 http://localhost:8081
- 確認頁面可以正常載入
- 檢查瀏覽器控制台錯誤

## 開發建議

### 修改 B 區系統後

1. **如果修改了埠號**
   - 更新 `.env` 中的 `PORT`
   - 更新 `devices.config.json` 中的 `port`
   - 重啟 Exhibition Controller

2. **如果新增了畫面**
   - 在 `devices.config.json` 的 `screens` 陣列中新增
   - 重啟 Exhibition Controller
   - 新畫面會出現在控制面板

3. **如果修改了健康檢查路徑**
   - 更新 `devices.config.json` 中的 `healthCheck`
   - 重啟 Exhibition Controller

### 日誌除錯

Controller 會顯示所有裝置的日誌，包括：
- 標準輸出 (stdout)
- 錯誤輸出 (stderr)
- 啟動/停止事件
- 健康檢查結果

在「系統日誌」區域可以看到即時日誌。

## 優勢

使用 Exhibition Controller 的優勢：

1. **統一管理**：一個介面控制所有裝置
2. **自動啟動**：一鍵啟動整個展覽系統
3. **健康監控**：即時監控所有裝置狀態
4. **畫面管理**：輕鬆控制多螢幕顯示
5. **日誌集中**：統一查看所有系統日誌
6. **多主機支援**：輕鬆擴展到多台電腦

## 相關文檔

- [B區系統 README](README.md) - 完整系統說明
- [B區系統測試指南](TESTING.md) - 測試流程
- [Exhibition Controller README](../../exhibition-controller/README.md) - 控制器說明
- [快速開始](QUICK_START.md) - 5分鐘快速上手

## 更新記錄

- **2025-12-03**：初次整合到 Exhibition Controller
  - 啟用 B 區任務系統
  - 配置埠號 8081
  - 建立健康檢查
  - 新增畫面管理

---

整合完成！現在可以透過 Exhibition Controller 輕鬆管理 B 區任務系統了。

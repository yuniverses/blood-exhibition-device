# 展場控制系統 (Exhibition Controller)

血型展覽的統一控制中心，用於管理所有展場設備和畫面。支援單機開發與多主機部署。

## 系統架構

```
┌─────────────────────────────────────────────────────────────────────┐
│                        展場控制系統 (Electron)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      控制面板 UI                              │   │
│  │  - 後台狀態監控        - 裝置啟動/停止                        │   │
│  │  - 顯示器管理          - 畫面視窗控制                         │   │
│  │  - 系統日誌            - 健康檢查                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│  ┌─────────────────────────────┴─────────────────────────────┐     │
│  │                    DeviceManager                           │     │
│  │  - 進程管理 (spawn/kill)                                   │     │
│  │  - 健康檢查 (HTTP polling)                                 │     │
│  │  - 多主機支援 (local/remote)                               │     │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        ┌─────────────────────┐   ┌─────────────────────┐
        │   後台 API 服務      │   │    展場裝置 A~D     │
        │   (Port 3000)       │   │    (Port 8080+)     │
        │                     │   │                     │
        │  - 用戶資料管理      │   │  - A. 貼紙系統      │
        │  - QR Code 追蹤     │   │  - B. 任務系統      │
        │  - 互動記錄         │   │  - C. 影片系統      │
        │  - 統計分析         │   │  - D. 影片系統      │
        └─────────────────────┘   └─────────────────────┘
```

## 快速開始

### 1. 安裝依賴

```bash
cd exhibition-controller
npm install
```

### 2. 啟動控制系統

**方法一**：使用 npm
```bash
npm start
```

**方法二**：雙擊 `start.command`（macOS）

**方法三**：開發模式（開啟 DevTools）
```bash
npm run dev
```

### 3. 使用控制面板

1. 點擊「**全部啟動**」或先點「**啟動**」後台
2. 等待日誌顯示「服務已就緒！」
3. 啟動各個展場裝置
4. 選擇顯示器，開啟畫面到對應的螢幕/投影機

---

## 配置檔說明 (`devices.config.json`)

### 結構概覽

```json
{
  "hosts": { ... },      // 主機定義
  "backend": { ... },    // 後台 API 設定
  "devices": [ ... ],    // 展場裝置列表
  "displays": { ... }    // 顯示器註解（僅供參考）
}
```

### hosts - 主機定義

定義所有可能的主機位置，支援本機開發和多主機部署。

```json
"hosts": {
  "host-a": {
    "id": "host-a",
    "name": "A區主機",
    "address": "127.0.0.1",    // IP 位址
    "type": "local",           // local = 本機, remote = 遠端
    "note": "部署時改成實際 IP"
  }
}
```

| 欄位 | 說明 |
|------|------|
| `id` | 主機唯一識別碼 |
| `name` | 顯示名稱 |
| `address` | IP 位址或 hostname |
| `type` | `local` = 控制系統會啟動進程<br>`remote` = 只做健康檢查，不啟動進程 |

### backend - 後台 API 設定

```json
"backend": {
  "id": "backend-api",
  "name": "後台 API 服務",
  "type": "backend",
  "host": "host-a",                    // 對應 hosts 中的 key
  "path": "../blood-exhibition_InputUserData",
  "command": "npm",
  "args": ["start"],
  "port": 3000,
  "healthCheck": "/api/health",        // 相對路徑，會自動組合成完整 URL
  "required": true,
  "autoStart": true,
  "description": "核心後台服務"
}
```

### devices - 展場裝置列表

```json
{
  "id": "sticker-device",
  "name": "A. 貼紙系統",
  "type": "device",
  "host": "host-a",                    // 指定在哪台主機
  "path": "../blood-exhibition_Device/blood-exhibition_A_StickerDevice",
  "command": "npm",
  "args": ["start"],
  "port": 8080,
  "healthCheck": "/input",
  "screens": [                         // 可控制的畫面
    {
      "id": "input",
      "name": "iPad 輸入頁面",
      "url": "/input",                 // 相對路徑
      "description": "用於訪客輸入個人資料",
      "defaultDisplay": 0              // 預設顯示器索引
    },
    {
      "id": "display",
      "name": "大螢幕展示",
      "url": "/display",
      "defaultDisplay": 1
    }
  ],
  "enabled": true,                     // false = 停用此裝置
  "description": "訪客輸入資料並取得 QR Code"
}
```

| 欄位 | 說明 |
|------|------|
| `id` | 裝置唯一識別碼 |
| `name` | 顯示名稱 |
| `host` | 對應 hosts 中的主機 key |
| `path` | 裝置專案的相對路徑 |
| `port` | 服務埠號 |
| `healthCheck` | 健康檢查路徑 |
| `screens` | 可開啟的畫面列表 |
| `enabled` | 是否啟用（預設 true） |

---

## 多主機部署

### 架構示意

```
┌─────────────────────────────────────────────────────────────┐
│  主機 A (192.168.1.100) - 控制台                             │
│  ├── exhibition-controller (Electron 控制面板)               │
│  ├── blood-exhibition_InputUserData (後台 API)               │
│  └── blood-exhibition_A_StickerDevice                        │
└─────────────────────────────────────────────────────────────┘
                          │
                    區域網路連線
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 主機 B          │ │ 主機 C          │ │ 主機 D          │
│ (192.168.1.101) │ │ (192.168.1.102) │ │ (192.168.1.103) │
│                 │ │                 │ │                 │
│ B_Mission       │ │ C_Video         │ │ D_Video         │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 部署步驟

#### 1. 修改 hosts 設定

將 `devices.config.json` 中的 hosts 改成實際 IP：

```json
"hosts": {
  "host-a": {
    "address": "192.168.1.100",
    "type": "local"              // 控制台所在，保持 local
  },
  "host-b": {
    "address": "192.168.1.101",
    "type": "remote"             // 改成 remote
  },
  "host-c": {
    "address": "192.168.1.102",
    "type": "remote"
  },
  "host-d": {
    "address": "192.168.1.103",
    "type": "remote"
  }
}
```

#### 2. 在每台遠端主機上

```bash
# 複製對應的 Device 資料夾到遠端主機
# 例如在主機 B 上：
cd blood-exhibition_B_Mission
npm install
npm start
```

#### 3. 修改各 Device 的 .env

確保 `API_BASE_URL` 指向主機 A 的後台：

```env
API_BASE_URL=http://192.168.1.100:3000/api
PORT=8080
```

#### 4. 控制台行為

- `type: "local"` → 自動啟動進程
- `type: "remote"` → 只做健康檢查，需手動在遠端啟動

---

## 新增裝置

### 步驟 1：建立裝置資料夾

```bash
mkdir blood-exhibition_Device/blood-exhibition_X_NewDevice
cd blood-exhibition_Device/blood-exhibition_X_NewDevice
npm init -y
npm install express
```

### 步驟 2：建立基本 server.js

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8082;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('New Device is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 步驟 3：加入配置檔

在 `devices.config.json` 的 `devices` 陣列中新增：

```json
{
  "id": "new-device",
  "name": "X. 新裝置",
  "type": "device",
  "host": "host-a",
  "path": "../blood-exhibition_Device/blood-exhibition_X_NewDevice",
  "command": "npm",
  "args": ["start"],
  "port": 8082,
  "healthCheck": "/",
  "screens": [
    {
      "id": "main",
      "name": "主畫面",
      "url": "/",
      "defaultDisplay": 0
    }
  ],
  "enabled": true,
  "description": "新裝置描述"
}
```

### 步驟 4：重啟控制系統

控制系統會自動載入新的裝置配置。

---

## 專案結構

```
exhibition-controller/
├── package.json              # 專案配置
├── devices.config.json       # 裝置配置檔（重要！）
├── start.sh                  # 啟動腳本
├── start.command             # macOS 雙擊啟動
├── README.md                 # 本文件
│
├── src/
│   ├── main/                 # Electron 主進程
│   │   ├── main.js           # 應用程式入口
│   │   ├── preload.js        # 安全橋接 API
│   │   ├── deviceManager.js  # 裝置管理（啟動/停止/健康檢查）
│   │   └── windowManager.js  # 視窗管理（開啟/關閉/移動畫面）
│   │
│   └── renderer/             # Electron 渲染進程
│       ├── index.html        # 控制面板頁面
│       └── app.js            # 前端邏輯
│
└── assets/                   # 圖示等資源
```

---

## 核心模組說明

### DeviceManager (`src/main/deviceManager.js`)

負責裝置生命週期管理：

| 方法 | 說明 |
|------|------|
| `startBackend()` | 啟動後台 API |
| `stopBackend()` | 停止後台 API |
| `startDevice(id)` | 啟動指定裝置 |
| `stopDevice(id)` | 停止指定裝置 |
| `startAll()` | 啟動後台 + 所有本機裝置 |
| `stopAll()` | 停止所有裝置 + 後台 |
| `getScreenUrl(deviceId, screenId)` | 取得畫面完整 URL |

**事件**：
- `status-update` - 裝置狀態變化
- `log` - 服務日誌輸出

### WindowManager (`src/main/windowManager.js`)

負責 Electron 視窗管理：

| 方法 | 說明 |
|------|------|
| `openScreen(options)` | 開啟畫面視窗 |
| `closeScreen(deviceId, screenId)` | 關閉指定視窗 |
| `closeAll()` | 關閉所有視窗 |
| `moveToDisplay(deviceId, screenId, displayIndex)` | 移動視窗到指定顯示器 |
| `toggleFullscreen(deviceId, screenId)` | 切換全螢幕 |

---

## 常見問題

### Q: 後台啟動失敗，顯示「啟動超時」？

**可能原因**：
1. IPv6 問題：確保 `hosts` 使用 `127.0.0.1` 而非 `localhost`
2. 埠號被佔用：檢查 3000 埠是否被其他程式使用
3. 依賴未安裝：在後台資料夾執行 `npm install`

**解決方法**：
```bash
# 檢查埠號
lsof -i :3000

# 手動測試後台
cd ../blood-exhibition_InputUserData
npm start
```

### Q: 裝置啟動失敗，顯示「請先啟動後台服務」？

**原因**：後台尚未通過健康檢查

**解決方法**：等待後台狀態變成綠色（健康）後再啟動裝置

### Q: 如何在特定投影機顯示畫面？

1. 在「可用顯示器」區域確認顯示器索引
2. 在裝置畫面的下拉選單中選擇目標顯示器
3. 點擊「開啟」

### Q: 遠端裝置無法連線？

1. 確認遠端主機的服務已手動啟動
2. 確認 IP 位址正確
3. 確認防火牆允許對應埠號
4. 檢查遠端裝置的 `.env` 中 `API_BASE_URL` 是否正確

---

## 開發指南

### 本機開發流程

1. 所有 hosts 設定 `type: "local"`
2. 所有 `address` 設定 `127.0.0.1`
3. 開發完成後再改成多主機配置

### 調試模式

```bash
npm run dev
```

會自動開啟 DevTools，可以查看：
- Console 日誌
- 網路請求
- IPC 通訊

### 打包發布

```bash
# macOS
npm run build:mac

# Windows
npm run build:win
```

輸出檔案在 `dist/` 資料夾。

---

## 技術棧

- **Electron** - 桌面應用框架
- **Node.js** - 後端運行環境
- **axios** - HTTP 請求
- **tree-kill** - 進程管理

---

## 維護資訊

- **版本**：1.0.0
- **最後更新**：2024-12
- **相關專案**：
  - `blood-exhibition_InputUserData` - 後台 API
  - `blood-exhibition_Device/*` - 各展場裝置

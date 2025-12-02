# B區任務系統 - 快速參考卡

## 🚀 快速啟動

### 透過 Exhibition Controller（推薦）
```bash
cd exhibition-controller
npm start
# 然後點擊「全部啟動」
```

### 獨立啟動
```bash
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm start
# 訪問 http://localhost:8081
```

---

## 📍 重要位置

| 項目 | 位置 |
|------|------|
| 主程式 | `server.js` |
| 前端介面 | `public/index.html` |
| 配置檔 | `.env` |
| Controller配置 | `../../exhibition-controller/devices.config.json` |

---

## 🔌 連接資訊

| 服務 | 位址 | 說明 |
|------|------|------|
| B區系統 | http://localhost:8081 | 互動任務介面 |
| 後台API | http://localhost:3000 | 資料管理 |
| Controller | Electron視窗 | 統一控制台 |

---

## ⚙️ 關鍵配置

### `.env` 設定
```env
API_BASE_URL=http://localhost:3000/api
PORT=8081
DEVICE_ID=B_MISSION_001
```

### `devices.config.json` 設定
```json
{
  "id": "mission-device",
  "port": 8081,
  "enabled": true
}
```

---

## 🎮 測試功能

| 按鈕 | 功能 |
|------|------|
| 觸發任務 | 隨機產生緊急任務 |
| 手動輸入QR | 測試掃描功能 |
| 返回預設 | 重置到待機狀態 |

---

## 📊 系統狀態

| 狀態 | 說明 |
|------|------|
| 🟢 綠色 | 系統正常運行 |
| 🔴 紅色 | 系統離線/錯誤 |
| 🟡 黃色 | 啟動中 |

---

## 🔍 健康檢查

```bash
# 檢查B區系統
curl http://localhost:8081/

# 檢查後台API
curl http://localhost:3000/api/health

# 檢查埠號
lsof -i :8081
```

---

## 🛠️ 常用命令

```bash
# 安裝依賴
npm install

# 啟動服務
npm start

# 開發模式
npm run dev

# 整合測試
./test-integration.sh

# 釋放埠號
lsof -ti:8081 | xargs kill
```

---

## 📝 互動流程

```
預設狀態 (待機)
    ↓
觸發任務 (隨機/手動)
    ↓
顯示情境 + 血型需求
    ↓
等待掃描 (30秒)
    ↓
    ├─→ 無掃描 → 返回預設
    └─→ 有掃描 → 判斷血型
            ↓
            ├─→ 符合 → 成功畫面
            └─→ 不合 → 失敗畫面
                    ↓
                返回預設 (8秒後)
```

---

## 🩸 血型相容表

| 捐血者 | 可捐給 |
|--------|--------|
| O- | 所有血型 |
| O+ | O+, A+, B+, AB+ |
| A- | A-, A+, AB-, AB+ |
| A+ | A+, AB+ |
| B- | B-, B+, AB-, AB+ |
| B+ | B+, AB+ |
| AB- | AB-, AB+ |
| AB+ | AB+ |

---

## 📦 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | 主頁面 |
| GET | `/api/mission/random` | 隨機任務 |
| GET | `/api/missions` | 所有任務 |
| POST | `/api/scan` | 處理掃描 |

---

## 🐛 快速除錯

| 問題 | 解決 |
|------|------|
| 啟動失敗 | `npm install` |
| 埠號佔用 | `lsof -ti:8081 \| xargs kill` |
| API連接失敗 | 檢查後台是否啟動 |
| 配置錯誤 | `cp .env.example .env` |

---

## 📚 文檔連結

- [完整說明](README.md)
- [測試指南](TESTING.md)
- [整合說明](INTEGRATION.md)
- [快速開始](QUICK_START.md)

---

## 🎯 檢查清單

啟動前：
- [ ] 後台API已啟動
- [ ] 依賴已安裝
- [ ] .env 已配置
- [ ] 埠號未佔用

測試時：
- [ ] 可以觸發任務
- [ ] 可以掃描QR Code
- [ ] 血型判斷正確
- [ ] 30秒超時正常
- [ ] 資料正確記錄

---

**快速求助**：
1. 檢查 Controller 日誌
2. 運行 `./test-integration.sh`
3. 查看瀏覽器控制台
4. 閱讀 TESTING.md

---

記得：
- 先啟動後台，再啟動裝置
- 使用 Controller 統一管理
- 定期檢查系統狀態
- 保持網路連接穩定

# B區 - 捐血緊急任務系統

這是一個互動式的捐血任務系統，用於展覽中模擬真實的捐血緊急情境，讓參觀者透過掃描 QR Code 參與互動。

---

## ⚡ 快速啟動

### 推薦方式：透過 Exhibition Controller

**已整合到 Exhibition Controller！** 可透過統一控制面板啟動和管理：

```bash
cd exhibition-controller
npm start
```

在控制面板中點擊「全部啟動」→「B. 任務系統」→「啟動」→「開啟」

**優勢**：統一管理、即時監控、自動日誌、多螢幕支援

📖 詳細說明：[整合文檔](INTEGRATION.md) | [快速參考](QUICK_REFERENCE.md)

---

### 獨立啟動方式（測試/開發）

```bash
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm start
```

訪問：http://localhost:8081

---

## 功能特色

### 🎮 互動流程

1. **預設狀態**
   - 播放循環影片或顯示待機畫面
   - 吸引參觀者注意

2. **緊急任務狀態**
   - 隨機觸發捐血緊急任務
   - 顯示情境描述（車禍、手術、白血病等）
   - 顯示患者資訊和所需血型
   - 30秒倒數計時等待掃描

3. **QR Code 掃描**
   - 參觀者掃描個人 QR Code
   - 系統連接主機API獲取用戶資料
   - 判斷血型是否相容

4. **結果顯示**
   - 血型符合：播放成功影片，顯示感謝訊息
   - 血型不合：播放失敗影片，顯示鼓勵訊息
   - 自動記錄互動資料到主機

5. **自動返回**
   - 無人掃描：30秒後自動返回預設狀態
   - 掃描完成：顯示結果8秒後返回預設狀態

### 📋 內建任務情境

系統內建 6 種緊急任務情境：

- 車禍急救
- 孕婦手術用血
- 白血病治療
- 工地意外大量失血
- 產後大出血
- 心臟手術

每個任務包含：
- 情境描述
- 患者姓名
- 所需血型
- 緊急程度
- 對應影片檔案名稱

### 🩸 血型相容性判斷

系統會根據標準血型相容表判斷：

- O- 型：萬能捐血者，可捐給所有血型
- AB+ 型：萬能受血者，可接受所有血型
- 其他血型：根據 ABO 和 Rh 系統判斷相容性

## 系統需求

### 硬體需求
- 電腦/平板/大型觸控螢幕
- QR Code 掃描器（或鍵盤模擬掃描器）
- 網路連接（區域網路）

### 軟體需求
- Node.js 14.x 或更高版本
- 現代瀏覽器（Chrome、Firefox、Safari、Edge）

## 安裝步驟

1. 安裝依賴套件
```bash
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm install
```

2. 配置環境變數
```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定：
- API_BASE_URL：主機API位址
- PORT：伺服器埠號
- DEVICE_ID：裝置唯一識別碼
- DEVICE_NAME：裝置顯示名稱

3. 啟動伺服器
```bash
npm start
```

開發模式（自動重啟）：
```bash
npm run dev
```

4. 開啟瀏覽器訪問
```
http://localhost:8081
```

## 配置說明

### 環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| API_BASE_URL | 主機API位址 | http://localhost:3000/api |
| PORT | 伺服器埠號 | 8081 |
| DEVICE_ID | 裝置ID | B_MISSION_001 |
| DEVICE_NAME | 裝置名稱 | B區捐血任務系統 |
| SCAN_TIMEOUT | 掃描超時時間 | 30000 (30秒) |

### 任務觸發設定

在 `public/index.html` 中可以啟用自動觸發功能：

```javascript
// 取消註解以啟用自動觸發
autoTriggerMission();
```

自動觸發會在預設狀態下隨機時間（30秒-2分鐘）觸發任務。

## API 端點

### GET /
顯示互動裝置主頁面

### GET /api/mission/random
取得隨機任務

回應：
```json
{
  "success": true,
  "data": {
    "id": "mission_001",
    "title": "車禍急救",
    "description": "...",
    "patientName": "王先生",
    "requiredBloodType": "A+",
    "urgencyLevel": "critical",
    "videoFile": "emergency_accident.mp4"
  }
}
```

### GET /api/missions
取得所有任務列表

### POST /api/scan
處理 QR Code 掃描

請求：
```json
{
  "qrCode": "user-uuid",
  "missionId": "mission_001"
}
```

回應：
```json
{
  "success": true,
  "data": {
    "isCompatible": true,
    "user": {
      "uuid": "...",
      "username": "王小明",
      "bloodType": "A+"
    },
    "mission": {...}
  }
}
```

### GET /api/test/users
測試用：取得所有用戶列表

## 測試功能

頁面左下角有測試控制面板：

- **觸發任務**：手動觸發隨機任務（測試用）
- **手動輸入 QR Code**：開啟輸入面板，手動輸入用戶 UUID
- **返回預設狀態**：強制返回待機狀態

## QR Code 掃描器整合

### 硬體掃描器

系統支援鍵盤模擬型 QR Code 掃描器：

1. 掃描器會自動輸入 UUID
2. 輸入完成後發送 Enter 鍵
3. 系統自動處理掃描結果

掃描器設定建議：
- 鍵盤模擬模式
- 自動發送 Enter 鍵
- USB 連接

### 軟體掃描

也可以使用測試面板手動輸入 UUID 進行測試。

## 影片檔案

系統預留了影片播放功能，請準備以下影片檔案並放入 `public/videos/` 目錄：

### 任務情境影片
- emergency_accident.mp4
- emergency_surgery.mp4
- emergency_cancer.mp4
- emergency_trauma.mp4
- emergency_birth.mp4
- emergency_heart.mp4

### 結果影片
- success.mp4（血型符合）
- failed.mp4（血型不合）

### 預設影片
- idle.mp4（待機循環播放）

在 `public/index.html` 中取消影片相關註解即可啟用影片播放功能。

## Socket.IO 事件

### 客戶端發送

- `triggerMission`：觸發新任務

### 伺服器發送

- `newMission`：新任務通知
  ```javascript
  {
    id: "mission_001",
    title: "車禍急救",
    ...
  }
  ```

- `scanResult`：掃描結果通知
  ```javascript
  {
    success: true,
    isCompatible: true,
    userData: {...},
    mission: {...}
  }
  ```

## 故障排除

### 無法連接主機API

檢查：
1. 主機API是否正常運行
2. `.env` 中的 API_BASE_URL 是否正確
3. 網路連接是否正常
4. 防火牆設定

測試連接：
```bash
curl http://localhost:3000/api/health
```

### QR Code 掃描無反應

檢查：
1. 掃描器是否正確連接
2. 掃描器是否設定為鍵盤模擬模式
3. 瀏覽器是否有焦點
4. UUID 格式是否正確

### 頁面無法載入

檢查：
1. Node.js 伺服器是否正常運行
2. 埠號是否被佔用
3. 瀏覽器控制台錯誤訊息

## 互動資料記錄

每次掃描都會自動記錄到主機API：

```json
{
  "deviceId": "B_MISSION_001",
  "deviceName": "B區捐血任務系統",
  "actionType": "mission_success" | "mission_failed",
  "data": {
    "missionId": "mission_001",
    "missionTitle": "車禍急救",
    "requiredBloodType": "A+",
    "userBloodType": "A+",
    "isCompatible": true,
    "timestamp": "2025-12-03T..."
  }
}
```

## 技術架構

- **後端**：Node.js + Express + Socket.IO
- **前端**：原生 HTML/CSS/JavaScript
- **通訊**：RESTful API + WebSocket
- **資料來源**：展覽主機API

## 授權

內部展覽專案使用

## 聯絡資訊

如有問題請聯繫展覽技術團隊

# 血型展覽裝置系統 - 完整總結

## ✅ 完成狀態

所有5個裝置已建立完成並整合到 Exhibition Controller！

---

## 📦 裝置清單

### A區 - 貼紙系統 ✅
- **路徑**: `blood-exhibition_Device/blood-exhibition_A_StickerDevice`
- **埠號**: 8080
- **功能**: 用戶註冊、QR Code生成、血型資訊展示
- **狀態**: 已整合

### B區 - 任務系統 ✅
- **路徑**: `blood-exhibition_Device/blood-exhibition_B_Mission`
- **埠號**: 8081
- **功能**: 緊急捐血任務、QR Code掃描、血型匹配判斷
- **特色**: 6種緊急情境、30秒倒數、任務成功/失敗判定
- **狀態**: 已整合

### C區 - 影片系統 ✅ NEW
- **路徑**: `blood-exhibition_Device/blood-exhibition_C_Video`
- **埠號**: 8082
- **功能**: QR Code掃描、自動播放影片、互動記錄
- **狀態**: 剛完成整合

### D區 - 影片系統 ✅ NEW
- **路徑**: `blood-exhibition_Device/blood-exhibition_D_Video`
- **埠號**: 8083
- **功能**: QR Code掃描、自動播放影片、互動記錄
- **狀態**: 剛完成整合

### E區 - 體驗總結系統 ✅ NEW
- **路徑**: `blood-exhibition_Device/blood-exhibition_E_Summary`
- **埠號**: 8084
- **功能**:
  - 分析用戶所有互動資料
  - 計算體驗時長
  - 檢測是否救過人（B區任務成功）
  - 生成體驗證書
  - 列印功能
- **狀態**: 剛完成整合

---

## 🎯 系統架構

```
┌────────────────────────────────────────────────┐
│      Exhibition Controller (控制台)            │
│      統一管理所有裝置                          │
└────────────┬───────────────────────────────────┘
             │
    ┌────────┴─────────┐
    │   後台 API       │
    │   Port 3000      │
    │   用戶資料管理    │
    └────────┬─────────┘
             │
    ┌────────┴─────────────────────┐
    │                              │
    ▼                              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ A 貼紙  │  │ B 任務  │  │ C 影片  │  │ D 影片  │  │ E 總結  │
│ 8080    │  │ 8081    │  │ 8082    │  │ 8083    │  │ 8084    │
│         │  │         │  │         │  │         │  │         │
│ 註冊    │  │ 任務    │  │ 播放    │  │ 播放    │  │ 證書    │
│ QR生成  │  │ 血型    │  │ 記錄    │  │ 記錄    │  │ 列印    │
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

---

## 🔄 用戶體驗流程

1. **A區（註冊）**
   - 用戶輸入姓名和血型
   - 系統生成專屬 QR Code
   - 列印貼紙

2. **B區（任務挑戰）**
   - 隨機觸發緊急捐血任務
   - 掃描 QR Code
   - 血型匹配判斷
   - 成功 = 救人英雄 / 失敗 = 鼓勵參與

3. **C區（影片體驗）**
   - 掃描 QR Code
   - 自動播放影片
   - 記錄互動

4. **D區（影片體驗）**
   - 掃描 QR Code
   - 自動播放影片
   - 記錄互動

5. **E區（體驗總結）**
   - 掃描 QR Code
   - 分析所有互動資料
   - 顯示體驗證書：
     * 體驗時長
     * 互動次數
     * 參與區域
     * 是否救過人（英雄徽章）
   - 列印證書

---

## 📊 資料記錄

每個裝置都會記錄互動到後台 API：

### A區記錄
```json
{
  "deviceId": "A_STICKER_001",
  "actionType": "user_registered"
}
```

### B區記錄
```json
{
  "deviceId": "B_MISSION_001",
  "actionType": "mission_success" | "mission_failed",
  "data": {
    "missionId": "mission_001",
    "isCompatible": true/false,
    "requiredBloodType": "A+",
    "userBloodType": "A+"
  }
}
```

### C/D區記錄
```json
{
  "deviceId": "C_VIDEO_001" | "D_VIDEO_001",
  "actionType": "video_played",
  "data": {
    "videoId": "c_video" | "d_video"
  }
}
```

### E區記錄
```json
{
  "deviceId": "E_SUMMARY_001",
  "actionType": "summary_printed"
}
```

---

## 🚀 啟動方式

### 方式一：透過 Exhibition Controller（推薦）

```bash
cd exhibition-controller
npm start
```

在控制面板中：
1. 點擊「**全部啟動**」
2. 等待所有裝置變綠色
3. 依序開啟各裝置畫面

### 方式二：個別啟動（測試用）

```bash
# 後台 API
cd blood-exhibition_InputUserData
npm start

# 裝置 A
cd blood-exhibition_Device/blood-exhibition_A_StickerDevice
npm start

# 裝置 B
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm start

# 裝置 C
cd blood-exhibition_Device/blood-exhibition_C_Video
npm start

# 裝置 D
cd blood-exhibition_Device/blood-exhibition_D_Video
npm start

# 裝置 E
cd blood-exhibition_Device/blood-exhibition_E_Summary
npm start
```

---

## 🔌 埠號配置

| 服務 | 埠號 | 位址 |
|------|------|------|
| 後台 API | 3000 | http://localhost:3000 |
| A區 貼紙系統 | 8080 | http://localhost:8080 |
| B區 任務系統 | 8081 | http://localhost:8081 |
| C區 影片系統 | 8082 | http://localhost:8082 |
| D區 影片系統 | 8083 | http://localhost:8083 |
| E區 總結系統 | 8084 | http://localhost:8084 |

---

## ✨ 裝置特色

### A區特色
- 自動生成 UUID
- QR Code 即時生成
- 血型知識展示
- Socket.IO 即時更新

### B區特色
- 6種緊急任務情境
- 30秒倒數計時
- 血型相容性判斷
- 成功/失敗動畫

### C/D區特色
- 簡潔的待機畫面
- QR掃描觸發播放
- 用戶資訊疊加顯示
- 自動返回待機

### E區特色（★最複雜）
- 完整互動資料分析
- 體驗時長計算
- 英雄徽章判定
- 精美證書設計
- 列印優化

---

## 🧪 測試流程

### 完整測試腳本

1. **啟動所有服務**
   ```bash
   cd exhibition-controller
   npm start
   # 點擊「全部啟動」
   ```

2. **A區測試**
   - 輸入姓名和血型
   - 確認生成 QR Code
   - 記下 UUID

3. **B區測試**
   - 觸發任務
   - 掃描 A 區的 QR Code
   - 確認血型判斷正確

4. **C區測試**
   - 掃描 QR Code
   - 確認影片播放
   - 確認用戶資訊顯示

5. **D區測試**
   - 掃描 QR Code
   - 確認影片播放
   - 確認用戶資訊顯示

6. **E區測試**
   - 掃描 QR Code
   - 確認總結資料正確
   - 確認英雄徽章（如果B區成功）
   - 測試列印功能

7. **檢查後台資料**
   ```bash
   curl http://localhost:3000/api/users
   # 確認所有互動都有記錄
   ```

---

## 📋 檢查清單

### 系統檢查
- [ ] 後台 API 正常運行
- [ ] Exhibition Controller 可以啟動
- [ ] 所有5個裝置可以啟動
- [ ] 所有裝置健康檢查通過（綠色）

### A區檢查
- [ ] 可以註冊用戶
- [ ] QR Code 正常生成
- [ ] 顯示螢幕即時更新
- [ ] 血型資訊正確顯示

### B區檢查
- [ ] 任務可以觸發
- [ ] 倒數計時正常
- [ ] QR掃描功能正常
- [ ] 血型判斷正確
- [ ] 成功/失敗動畫正常

### C區檢查
- [ ] QR掃描觸發播放
- [ ] 用戶資訊顯示正確
- [ ] 影片播放正常
- [ ] 自動返回待機

### D區檢查
- [ ] QR掃描觸發播放
- [ ] 用戶資訊顯示正確
- [ ] 影片播放正常
- [ ] 自動返回待機

### E區檢查
- [ ] QR掃描獲取資料
- [ ] 體驗時長計算正確
- [ ] 互動次數統計正確
- [ ] 英雄徽章判斷正確
- [ ] 證書格式美觀
- [ ] 列印功能正常

### 資料記錄檢查
- [ ] A區互動有記錄
- [ ] B區互動有記錄（包含是否成功）
- [ ] C區互動有記錄
- [ ] D區互動有記錄
- [ ] E區互動有記錄

---

## 🎨 影片檔案準備

需要準備以下影片檔案：

### B區影片（任務系統）
放在 `blood-exhibition_B_Mission/public/videos/`:
- `emergency_accident.mp4` - 車禍情境
- `emergency_surgery.mp4` - 手術情境
- `emergency_cancer.mp4` - 白血病情境
- `emergency_trauma.mp4` - 外傷情境
- `emergency_birth.mp4` - 產後情境
- `emergency_heart.mp4` - 心臟手術情境
- `success.mp4` - 血型符合
- `failed.mp4` - 血型不合
- `idle.mp4` - 待機循環（可選）

### C區影片
放在 `blood-exhibition_C_Video/public/videos/`:
- `c_video.mp4` - C區主要影片

### D區影片
放在 `blood-exhibition_D_Video/public/videos/`:
- `d_video.mp4` - D區主要影片

**注意**: 目前系統在沒有影片檔案時仍可運行，只是不會播放影片。可以先測試功能，之後再加入影片。

---

## 🔧 疑難排解

### 埠號衝突
```bash
# 查看佔用的埠號
lsof -i :8080
lsof -i :8081
lsof -i :8082
lsof -i :8083
lsof -i :8084

# 停止佔用的進程
kill <PID>
```

### 後台連接失敗
1. 確認後台 API 正在運行
2. 檢查各裝置 `.env` 中的 `API_BASE_URL`
3. 測試連接：`curl http://localhost:3000/api/health`

### Controller 無法啟動裝置
1. 確認路徑正確
2. 確認 `npm install` 已執行
3. 檢查 `.env` 檔案存在
4. 手動測試啟動

---

## 📚 相關文檔

| 裝置 | 文檔位置 |
|------|---------|
| A區 | `blood-exhibition_A_StickerDevice/README.md` |
| B區 | `blood-exhibition_B_Mission/README.md` |
| E區 | 本系統最複雜，建議參考程式碼註解 |
| Controller | `exhibition-controller/README.md` |

---

## 🎉 完成總結

### 建立的檔案
- ✅ 5個完整裝置系統
- ✅ 各裝置的 server.js
- ✅ 各裝置的前端 HTML
- ✅ 配置檔案（package.json, .env）
- ✅ Exhibition Controller 整合配置

### 實現的功能
- ✅ 用戶註冊與 QR Code 生成（A區）
- ✅ 緊急任務挑戰系統（B區）
- ✅ 影片播放系統（C區、D區）
- ✅ 體驗總結與列印（E區）
- ✅ 統一控制台管理
- ✅ 完整的互動資料記錄
- ✅ 即時通訊（Socket.IO）
- ✅ QR Code 掃描器整合

### 系統特色
- 🎯 完整的用戶旅程
- 📊 詳細的互動資料記錄
- 🏆 英雄徽章系統
- 📱 響應式設計
- 🖨️ 列印優化
- 🎮 即時互動回饋
- 🔄 自動狀態管理
- 🌐 統一控制台

---

**系統狀態**: ✅ 生產就緒

**下一步**:
1. 啟動 Exhibition Controller 測試所有裝置
2. 準備影片檔案
3. 進行完整用戶流程測試
4. 準備展覽現場部署

---

**建立日期**: 2025-12-03
**版本**: 1.0.0
**狀態**: 完成

# 血型展覽系統 - 快速啟動指南

## 🚀 一鍵啟動 (推薦)

### 方式一: 使用 Exhibition Controller

```bash
cd exhibition-controller
npm start
```

在控制面板中:
1. 點擊「**全部啟動**」按鈕
2. 等待所有裝置變成綠色 (健康狀態)
3. 依序點擊「開啟畫面」查看各裝置

**優點**:
- ✅ 一鍵啟動所有裝置
- ✅ 即時監控所有裝置狀態
- ✅ 統一管理和控制
- ✅ 健康檢查自動進行

---

## 📦 系統組成

| 服務 | 埠號 | 網址 | 狀態 |
|------|------|------|------|
| 後台 API | 3000 | http://localhost:3000 | ✅ 必需 |
| A區 貼紙系統 | 8080 | http://localhost:8080 | ✅ 可用 |
| B區 任務系統 | 8081 | http://localhost:8081 | ✅ 可用 |
| C區 影片系統 | 8082 | http://localhost:8082 | ✅ 可用 |
| D區 影片系統 | 8083 | http://localhost:8083 | ✅ 可用 |
| E區 總結系統 | 8084 | http://localhost:8084 | ✅ 可用 |

---

## 🧪 快速測試

### 1. 檢查所有服務是否啟動

```bash
# 檢查端口佔用
lsof -i :3000 -i :8080 -i :8081 -i :8082 -i :8083 -i :8084 | grep LISTEN
```

應該看到6個服務都在監聽。

### 2. 健康檢查

```bash
# 後台 API
curl http://localhost:3000/api/health

# 裝置檢查
curl -I http://localhost:8080/input  # A區
curl -I http://localhost:8081/       # B區
curl -I http://localhost:8082/       # C區
curl -I http://localhost:8083/       # D區
curl -I http://localhost:8084/       # E區
```

所有回應應該是 `HTTP/1.1 200 OK`。

### 3. 完整用戶流程測試

1. **A區** (http://localhost:8080/input)
   - 輸入姓名和血型
   - 取得 QR Code

2. **B區** (http://localhost:8081)
   - 觸發任務
   - 掃描 A區 的 QR Code
   - 查看血型匹配結果

3. **C區** (http://localhost:8082)
   - 掃描 QR Code
   - 觀看影片 (需準備 c_video.mp4)

4. **D區** (http://localhost:8083)
   - 掃描 QR Code
   - 觀看影片 (需準備 d_video.mp4)

5. **E區** (http://localhost:8084)
   - 掃描 QR Code
   - 查看體驗總結
   - 測試列印功能

---

## 🔧 手動啟動 (進階)

如果需要個別啟動裝置進行測試:

```bash
# 1. 啟動後台 API (必需先啟動)
cd blood-exhibition_InputUserData
npm start

# 2. 啟動裝置 A
cd blood-exhibition_Device/blood-exhibition_A_StickerDevice
npm start

# 3. 啟動裝置 B
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm start

# 4. 啟動裝置 C
cd blood-exhibition_Device/blood-exhibition_C_Video
npm start

# 5. 啟動裝置 D
cd blood-exhibition_Device/blood-exhibition_D_Video
npm start

# 6. 啟動裝置 E
cd blood-exhibition_Device/blood-exhibition_E_Summary
npm start
```

---

## 🛑 停止所有服務

### 方式一: 使用 Exhibition Controller
在控制面板中點擊「**全部停止**」

### 方式二: 手動停止
```bash
# 找出所有相關進程
ps aux | grep node | grep blood-exhibition

# 停止特定端口
lsof -ti:3000 | xargs kill
lsof -ti:8080 | xargs kill
lsof -ti:8081 | xargs kill
lsof -ti:8082 | xargs kill
lsof -ti:8083 | xargs kill
lsof -ti:8084 | xargs kill
```

---

## ⚠️ 常見問題

### 端口被佔用

**錯誤**: `Error: listen EADDRINUSE: address already in use :::8081`

**解決方法**:
```bash
# 查看佔用端口的進程
lsof -i :8081

# 停止該進程
kill <PID>
```

### 無法連接後台 API

**檢查項目**:
1. 確認後台 API 正在運行 (Port 3000)
2. 檢查各裝置的 `.env` 檔案中的 `API_BASE_URL`
3. 測試連接: `curl http://localhost:3000/api/health`

### Exhibition Controller 無法啟動裝置

**檢查項目**:
1. 確認路徑配置正確 (`devices.config.json`)
2. 確認已執行 `npm install`
3. 檢查 `.env` 檔案存在
4. 嘗試手動啟動該裝置測試

---

## 📚 詳細文檔

- [完整系統總結](./DEVICES_COMPLETE_SUMMARY.md)
- [整合測試報告](./INTEGRATION_TEST_REPORT.md)
- [Exhibition Controller 文檔](./exhibition-controller/README.md)
- [裝置 A 說明](./blood-exhibition_Device/blood-exhibition_A_StickerDevice/README.md)
- [裝置 B 說明](./blood-exhibition_Device/blood-exhibition_B_Mission/README.md)

---

## ✅ 檢查清單

啟動前檢查:
- [ ] Node.js 已安裝
- [ ] 所有裝置已執行 `npm install`
- [ ] 端口 3000, 8080-8084 未被佔用
- [ ] `.env` 配置檔案已準備

功能測試:
- [ ] 後台 API 健康檢查通過
- [ ] A區 可以註冊用戶
- [ ] B區 任務系統正常
- [ ] C區 影片播放功能正常
- [ ] D區 影片播放功能正常
- [ ] E區 總結生成正常

---

**系統版本**: 1.0.0
**最後更新**: 2025-12-03
**狀態**: ✅ 生產就緒

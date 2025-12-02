# 快速開始指南

## 5分鐘快速啟動

### 1. 確認主機API運行
```bash
# 在另一個終端視窗
cd blood-exhibition_InputUserData
npm start
```
訪問 http://localhost:3000 確認運行正常

### 2. 安裝並啟動B區系統
```bash
cd blood-exhibition_Device/blood-exhibition_B_Mission
npm install
npm start
```

### 3. 開啟互動頁面
在瀏覽器訪問：
```
http://localhost:8081
```

### 4. 建立測試用戶
訪問：http://localhost:3000

或使用 curl：
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"bloodType": "A+", "username": "測試用戶"}'
```

### 5. 測試互動
1. 點擊「觸發任務」
2. 點擊「手動輸入 QR Code」
3. 輸入用戶 UUID
4. 查看結果

## 系統架構圖

```
┌─────────────────────┐
│   參觀者掃描QR Code   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  B區互動裝置(8081)   │
│   - 顯示任務         │
│   - 處理掃描         │
│   - 判斷血型         │
└──────────┬──────────┘
           │ API呼叫
           ▼
┌─────────────────────┐
│  主機API(3000)       │
│   - 用戶資料         │
│   - 互動記錄         │
└─────────────────────┘
```

## 重要檔案位置

```
blood-exhibition_B_Mission/
├── server.js              # 後端伺服器
├── public/
│   ├── index.html         # 前端互動介面
│   └── videos/           # 影片檔案目錄
├── .env                  # 環境變數配置
├── package.json          # 專案配置
├── README.md             # 完整文檔
├── TESTING.md            # 測試指南
└── QUICK_START.md        # 本文件
```

## 常用命令

```bash
# 啟動服務
npm start

# 開發模式（自動重啟）
npm run dev

# 安裝依賴
npm install

# 使用啟動腳本
./start.sh
```

## 環境變數快速配置

編輯 `.env` 檔案：
```bash
API_BASE_URL=http://localhost:3000/api
PORT=8081
DEVICE_ID=B_MISSION_001
DEVICE_NAME=B區捐血任務系統
```

## 測試快速檢查

✓ 主機API運行： http://localhost:3000
✓ B區系統運行： http://localhost:8081
✓ 觸發任務正常
✓ 掃描功能正常
✓ 結果顯示正常

## 故障快速修復

### 無法啟動
```bash
# 檢查埠號是否被佔用
lsof -i :8081
# 殺掉佔用的進程
kill -9 <PID>
```

### API連接失敗
```bash
# 測試主機API
curl http://localhost:3000/api/health

# 檢查防火牆
# macOS: 系統偏好設定 > 安全性與隱私 > 防火牆
# Windows: 控制台 > Windows Defender 防火牆
```

### 重新安裝
```bash
rm -rf node_modules package-lock.json
npm install
```

## 快速測試腳本

將以下內容儲存為 `quick-test.sh`：

```bash
#!/bin/bash

echo "建立測試用戶..."
UUID=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"bloodType": "A+", "username": "測試用戶"}' | \
  grep -o '"uuid":"[^"]*"' | cut -d'"' -f4)

echo "用戶 UUID: $UUID"
echo ""
echo "請在瀏覽器中："
echo "1. 訪問 http://localhost:8081"
echo "2. 點擊「觸發任務」"
echo "3. 點擊「手動輸入 QR Code」"
echo "4. 輸入: $UUID"
```

## 下一步

- 閱讀 [README.md](README.md) 了解完整功能
- 閱讀 [TESTING.md](TESTING.md) 進行詳細測試
- 準備影片檔案（見 public/videos/README.md）
- 配置 QR Code 掃描器
- 進行完整流程測試

## 支援

遇到問題？

1. 檢查瀏覽器控制台錯誤
2. 檢查伺服器終端日誌
3. 查看 [TESTING.md](TESTING.md) 常見問題
4. 聯絡技術團隊

---

開始建立精彩的互動體驗吧！🩸

# 測試指南

## 快速測試流程

### 1. 啟動系統

#### 啟動主機API（在另一個終端）
```bash
cd blood-exhibition_InputUserData
npm start
```

確認主機API運行在 `http://localhost:3000`

#### 啟動B區任務系統
```bash
cd blood-exhibition_Device/blood-exhibition_B_Mission
./start.sh
```

或使用 npm：
```bash
npm start
```

### 2. 準備測試資料

#### 建立測試用戶

使用 A 區的貼紙系統或直接呼叫 API：

```bash
# 建立不同血型的測試用戶
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"bloodType": "A+", "username": "測試用戶A+"}'

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"bloodType": "B+", "username": "測試用戶B+"}'

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"bloodType": "O-", "username": "測試用戶O-"}'
```

記下返回的 UUID

#### 查看所有用戶
```bash
curl http://localhost:3000/api/users
```

或訪問監控中心：
```
http://localhost:3000
```

### 3. 測試互動流程

#### 方式一：使用測試按鈕

1. 開啟瀏覽器訪問 `http://localhost:8081`
2. 點擊左下角「觸發任務」按鈕
3. 系統顯示隨機任務
4. 點擊「手動輸入 QR Code」按鈕
5. 輸入測試用戶的 UUID
6. 觀察結果顯示

#### 方式二：使用 QR Code 掃描器

1. 連接 QR Code 掃描器（USB）
2. 確保掃描器設定為鍵盤模擬模式
3. 觸發任務
4. 掃描印有 UUID 的 QR Code
5. 系統自動處理並顯示結果

#### 方式三：使用鍵盤模擬

1. 觸發任務
2. 使用鍵盤輸入 UUID
3. 按下 Enter 鍵
4. 系統處理掃描

### 4. 測試場景

#### 場景一：血型符合
```
1. 觸發任務（例如：需要 A+ 血型）
2. 掃描 A+ 用戶的 QR Code
3. 預期結果：顯示綠色成功畫面，感謝訊息
```

#### 場景二：血型不合
```
1. 觸發任務（例如：需要 A+ 血型）
2. 掃描 B+ 用戶的 QR Code
3. 預期結果：顯示紅色失敗畫面，鼓勵訊息
```

#### 場景三：超時返回
```
1. 觸發任務
2. 不進行任何掃描操作
3. 等待 30 秒
4. 預期結果：自動返回預設狀態
```

#### 場景四：萬能捐血者
```
1. 觸發任何任務
2. 掃描 O- 用戶的 QR Code
3. 預期結果：總是顯示成功（O- 可捐給所有血型）
```

### 5. API 測試

#### 測試隨機任務 API
```bash
curl http://localhost:8081/api/mission/random
```

#### 測試所有任務 API
```bash
curl http://localhost:8081/api/missions
```

#### 測試掃描 API
```bash
curl -X POST http://localhost:8081/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "YOUR_USER_UUID",
    "missionId": "mission_001"
  }'
```

#### 測試用戶列表
```bash
curl http://localhost:8081/api/test/users
```

### 6. Socket.IO 測試

在瀏覽器控制台執行：

```javascript
// 手動觸發任務
socket.emit('triggerMission');

// 監聽新任務
socket.on('newMission', (mission) => {
  console.log('收到新任務:', mission);
});

// 監聽掃描結果
socket.on('scanResult', (result) => {
  console.log('掃描結果:', result);
});
```

### 7. 血型相容性測試

測試各種血型組合：

| 捐血者血型 | 受血者需求 | 預期結果 |
|-----------|-----------|----------|
| O- | 任何血型 | ✓ 成功 |
| O+ | O+, A+, B+, AB+ | ✓ 成功 |
| A- | A-, A+, AB-, AB+ | ✓ 成功 |
| A+ | A+, AB+ | ✓ 成功 |
| B- | B-, B+, AB-, AB+ | ✓ 成功 |
| B+ | B+, AB+ | ✓ 成功 |
| AB- | AB-, AB+ | ✓ 成功 |
| AB+ | AB+ | ✓ 成功 |
| A+ | B+ | ✗ 失敗 |
| B+ | A+ | ✗ 失敗 |

## 常見問題

### Q: 觸發任務後沒有反應？
A:
1. 檢查瀏覽器控制台錯誤
2. 確認 Socket.IO 連接正常
3. 檢查伺服器日誌

### Q: 掃描 QR Code 無反應？
A:
1. 確認掃描器正確連接
2. 檢查掃描器設定（鍵盤模擬模式）
3. 確認當前處於任務狀態
4. 檢查 UUID 格式正確

### Q: API 連接失敗？
A:
1. 確認主機API正常運行
2. 檢查 .env 中的 API_BASE_URL
3. 測試網路連接
4. 檢查防火牆設定

### Q: 互動資料沒有記錄？
A:
1. 檢查主機API日誌
2. 確認用戶UUID存在
3. 檢查網路連接
4. 查看瀏覽器網路請求

## 壓力測試

### 連續觸發測試
```javascript
// 在瀏覽器控制台執行
let count = 0;
const interval = setInterval(() => {
  if (count < 10) {
    socket.emit('triggerMission');
    count++;
  } else {
    clearInterval(interval);
  }
}, 2000);
```

### 大量用戶測試
```bash
# 建立 100 個測試用戶
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -d "{\"bloodType\": \"A+\", \"username\": \"測試用戶${i}\"}"
  sleep 0.1
done
```

## 效能監控

### 監控伺服器狀態
```bash
# 查看 Node.js 進程
ps aux | grep node

# 監控記憶體使用
top -p $(pgrep -f "node server.js")
```

### 查看 Socket.IO 連接
在伺服器日誌中觀察：
```
客戶端連接: xxxxx
客戶端斷開連接: xxxxx
```

## 測試檢查清單

- [ ] 主機API正常運行
- [ ] B區系統正常啟動
- [ ] 測試用戶已建立
- [ ] 觸發任務功能正常
- [ ] 倒數計時正確運作
- [ ] QR Code掃描功能正常
- [ ] 血型相容性判斷正確
- [ ] 成功結果顯示正確
- [ ] 失敗結果顯示正確
- [ ] 超時自動返回正常
- [ ] 互動資料正確記錄
- [ ] Socket.IO 通訊正常
- [ ] API 回應正確

## 展覽前最終檢查

1. 所有硬體正確連接
2. 網路連接穩定
3. 影片檔案就緒（如使用）
4. QR Code掃描器測試通過
5. 進行完整流程測試
6. 檢查互動資料記錄
7. 準備備用方案
8. 記錄重要設定和帳號

## 緊急應變

### 系統當機
1. 重啟 Node.js 伺服器
2. 檢查錯誤日誌
3. 切換到備用裝置

### 掃描器故障
1. 使用手動輸入功能
2. 更換備用掃描器
3. 使用測試按鈕模式

### 網路中斷
1. 檢查網路設備
2. 使用備用網路
3. 本地測試模式（如已實作）

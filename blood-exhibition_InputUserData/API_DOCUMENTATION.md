# Exhibition Local Database API Documentation

## 概述
本地端展覽資料庫API系統，用於管理展覽參觀者資訊與互動記錄。

## 啟動方式

```bash
# 安裝套件
npm install

# 啟動伺服器
npm start

# 開發模式（自動重啟）
npm run dev

# 執行測試
npm test
```

伺服器預設運行在 port 3000，支援區域網路內所有裝置存取。

## 基礎 URL
- 本地存取：`http://localhost:3000/api`
- 區域網路存取：`http://[YOUR_IP]:3000/api`

## 資料結構

### User Object
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "bloodType": "A+",
  "username": "張小明",
  "entryTime": "2024-01-01T10:00:00.000Z",
  "interactions": [
    {
      "deviceId": "DEVICE001",
      "deviceName": "互動裝置1",
      "actionType": "scan",
      "data": {},
      "timestamp": "2024-01-01T10:05:00.000Z"
    }
  ],
  "lastUpdated": "2024-01-01T10:05:00.000Z",
  "customField1": "自訂資料1",
  "customField2": "自訂資料2"
}
```

## API Endpoints

### 1. 健康檢查
**GET** `/api/health`

回應範例：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "service": "Exhibition Local Database API"
}
```

### 2. 新增用戶
**POST** `/api/users`

請求內容：
```json
{
  "bloodType": "A+",
  "username": "張小明",
  "department": "工程部",
  "customField": "任意自訂欄位"
}
```

回應範例：
```json
{
  "success": true,
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "bloodType": "A+",
    "username": "張小明",
    "entryTime": "2024-01-01T10:00:00.000Z",
    "interactions": [],
    "department": "工程部",
    "customField": "任意自訂欄位"
  }
}
```

### 3. 批次新增用戶
**POST** `/api/users/batch`

請求內容：
```json
[
  {
    "bloodType": "B+",
    "username": "用戶1"
  },
  {
    "bloodType": "O-",
    "username": "用戶2"
  }
]
```

回應範例：
```json
{
  "success": true,
  "data": {
    "count": 2,
    "users": [...]
  }
}
```

### 4. 取得所有用戶
**GET** `/api/users`

回應範例：
```json
{
  "success": true,
  "data": [
    {
      "uuid": "...",
      "bloodType": "A+",
      "username": "張小明",
      ...
    }
  ]
}
```

### 5. 依UUID取得用戶
**GET** `/api/users/:uuid`

範例：`GET /api/users/550e8400-e29b-41d4-a716-446655440000`

### 6. 依欄位搜尋
**GET** `/api/users/search/:field/:value`

範例：
- `GET /api/users/search/bloodType/A+`
- `GET /api/users/search/department/工程部`

### 7. 更新用戶資料
**PUT** `/api/users/:uuid` 或 **PATCH** `/api/users/:uuid`

請求內容：
```json
{
  "department": "研發部",
  "location": "A棟",
  "newCustomField": "新增的欄位"
}
```

### 8. 新增互動記錄
**POST** `/api/users/:uuid/interactions`

請求內容：
```json
{
  "deviceId": "DEVICE001",
  "deviceName": "互動螢幕1",
  "actionType": "scan",
  "data": {
    "content": "觀看展覽內容",
    "duration": 120
  }
}
```

### 9. 刪除用戶
**DELETE** `/api/users/:uuid`

### 10. 取得統計資訊
**GET** `/api/statistics`

回應範例：
```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "bloodTypes": {
      "A+": 15,
      "B+": 10,
      "O+": 20,
      "AB+": 5
    },
    "totalInteractions": 250,
    "averageInteractionsPerUser": 5
  }
}
```

## 錯誤處理

錯誤回應格式：
```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

常見錯誤碼：
- 400: 請求錯誤（驗證失敗）
- 404: 資源不存在
- 500: 伺服器內部錯誤

## 血型值
支援的血型值：
- `A`, `B`, `AB`, `O`
- `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

## 擴充欄位

系統支援動態擴充欄位。只要在請求中加入新的欄位名稱，系統會自動儲存。

範例：
```json
{
  "bloodType": "A+",
  "username": "測試用戶",
  "newField1": "新欄位1的值",
  "newField2": {
    "nested": "支援巢狀物件"
  },
  "newField3": ["也", "支援", "陣列"]
}
```

## 使用範例

### JavaScript (瀏覽器或Node.js)
```javascript
// 新增用戶
fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bloodType: 'A+',
    username: '測試用戶'
  })
})
.then(res => res.json())
.then(data => console.log(data));

// 取得用戶
fetch('http://localhost:3000/api/users/[UUID]')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Python
```python
import requests

# 新增用戶
response = requests.post(
    'http://localhost:3000/api/users',
    json={
        'bloodType': 'A+',
        'username': '測試用戶'
    }
)
print(response.json())
```

### cURL
```bash
# 新增用戶
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"bloodType":"A+","username":"測試用戶"}'

# 取得所有用戶
curl http://localhost:3000/api/users
```

## 注意事項

1. 資料儲存在 `database.json` 檔案中
2. UUID 會自動產生，也可以在新增時自行提供
3. 所有時間戳記使用 ISO 8601 格式
4. CORS 設定允許區域網路內所有裝置存取
5. 支援同時多個裝置存取，但寫入操作可能有競爭條件

## 部署建議

1. 使用 PM2 管理程序：
```bash
npm install -g pm2
pm2 start server.js --name exhibition-api
pm2 save
pm2 startup
```

2. 定期備份 `database.json` 檔案

3. 可考慮使用 nginx 反向代理增加安全性
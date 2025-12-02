# E區體驗總結系統 - 防重複列印功能

## 📋 功能說明

當訪客在 E區 掃描 QR Code 後：

### 第一次掃描
- ✅ 顯示完整的體驗總結證書
- ✅ 顯示「列印貼紙」按鈕
- ✅ 允許列印證書
- ✅ **記錄** `summary_printed` 互動到後台

### 第二次及之後掃描
- ✅ 顯示完整的體驗總結證書
- ✅ 顯示「✓ 已領取貼紙」提示
- ❌ **隱藏**「列印貼紙」按鈕
- ❌ **不再記錄**新的 `summary_printed` 互動
- ✅ 訪客仍可查看自己的證書內容

---

## 🔧 技術實現

### 後端檢查邏輯 (`server.js`)

```javascript
// 檢查是否已經列印過
const interactions = userData.interactions || [];
const hasPrinted = interactions.some(i => i.actionType === 'summary_printed');

// 如果是第一次掃描，記錄此次查詢互動
if (!hasPrinted) {
  const interactionData = {
    deviceId: DEVICE_ID,
    deviceName: DEVICE_NAME,
    actionType: 'summary_printed',
    data: {
      timestamp: new Date().toISOString()
    }
  };

  await axios.post(
    `${API_BASE_URL}/users/${uuid}/interactions`,
    interactionData
  );
}

// 回傳是否已列印的標記
res.json({
  success: true,
  data: {
    summary: summary,
    qrCode: qrCodeDataUrl,
    hasPrinted: hasPrinted  // 新增此欄位
  }
});
```

### 前端顯示邏輯 (`index.html`)

```javascript
function showSummary(summary, qrCode, hasPrinted = false) {
  // ... 更新資料 ...

  // 根據是否已列印顯示不同內容
  const alreadyPrinted = document.getElementById('alreadyPrinted');
  const printButton = document.getElementById('printButton');

  if (hasPrinted) {
    // 已列印：顯示提示，隱藏列印按鈕
    alreadyPrinted.style.display = 'block';
    printButton.style.display = 'none';
  } else {
    // 未列印：隱藏提示，顯示列印按鈕
    alreadyPrinted.style.display = 'none';
    printButton.style.display = 'inline-block';
  }
}
```

---

## 🎨 UI 變化

### 第一次掃描時
```
┌──────────────────────────────────┐
│   血型展覽體驗證書                │
│   感謝您的熱心參與                │
├──────────────────────────────────┤
│   參與者：王小明                  │
│   A+                              │
│                                  │
│   [統計資訊]                      │
│                                  │
│   [QR Code]                       │
├──────────────────────────────────┤
│  [列印貼紙]  [返回]              │
└──────────────────────────────────┘
```

### 第二次及之後掃描時
```
┌──────────────────────────────────┐
│   血型展覽體驗證書                │
│   感謝您的熱心參與                │
├──────────────────────────────────┤
│   參與者：王小明                  │
│   A+                              │
│                                  │
│   [統計資訊]                      │
│                                  │
│   [QR Code]                       │
├──────────────────────────────────┤
│   ┌────────────────────────┐    │
│   │  ✓ 已領取貼紙          │    │
│   │  您已經列印過體驗證書囉！│   │
│   └────────────────────────┘    │
│              [返回]              │
└──────────────────────────────────┘
```

---

## 📊 資料流程

```
訪客掃描 QR Code
      ↓
從後台 API 取得用戶資料
      ↓
檢查 interactions 陣列
      ↓
是否有 'summary_printed'?
      ↓
    ┌──NO──┐         ┌──YES──┐
    ↓      ↓         ↓       ↓
記錄互動  顯示列印鈕  不記錄   隱藏列印鈕
    ↓      ↓         ↓       ↓
允許列印  ←──────────→  顯示已領取
```

---

## 🔍 驗證方式

### 測試步驟

1. **第一次掃描測試**：
   ```bash
   # 在 A區 註冊一個新用戶，取得 UUID
   # 例如：123e4567-e89b-12d3-a456-426614174000
   ```

2. **在 E區 第一次掃描**：
   - 應該看到「列印貼紙」按鈕
   - 點擊可以列印
   - 後台會記錄 `summary_printed` 互動

3. **檢查後台記錄**：
   ```bash
   curl http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
   ```

   應該在 `interactions` 中看到：
   ```json
   {
     "deviceId": "E_SUMMARY_001",
     "actionType": "summary_printed",
     "timestamp": "2025-12-03T..."
   }
   ```

4. **在 E區 第二次掃描同一個 QR Code**：
   - 應該看到「✓ 已領取貼紙」提示
   - 「列印貼紙」按鈕應該被隱藏
   - 仍可點擊「返回」回到待機畫面

5. **再次檢查後台記錄**：
   ```bash
   curl http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
   ```

   `interactions` 中的 `summary_printed` 數量應該**仍然是 1 個**（沒有增加）

---

## ✅ 功能優點

1. **防止資源浪費**：避免同一訪客重複列印多張貼紙
2. **保持資料準確**：只記錄實際的首次列印行為
3. **友善的使用者體驗**：
   - 清楚告知已領取狀態
   - 仍可查看證書內容
   - 保留返回功能
4. **簡單的管理**：自動檢查，無需人工干預

---

## 🎯 使用場景

### 場景 1：正常流程
訪客完成所有體驗區 → 在 E區 第一次掃描 → 領取並列印證書 → 完成

### 場景 2：訪客想再看一次
訪客回到 E區 → 再次掃描 QR Code → 看到「已領取」提示 → 可查看證書但無法再列印

### 場景 3：訪客忘記是否列印過
訪客不確定 → 掃描 QR Code → 系統自動檢查並顯示正確狀態

---

## 🔧 維護說明

### 如果需要允許某位訪客重新列印

1. 連接到後台 API
2. 刪除該訪客的 `summary_printed` 互動記錄：

   ```bash
   # 獲取用戶資料
   curl http://localhost:3000/api/users/{uuid}

   # 手動編輯資料庫，移除 summary_printed 記錄
   ```

3. 訪客再次掃描時就會被視為第一次掃描

### 如果需要查看誰已經列印過

```bash
# 查詢所有用戶
curl http://localhost:3000/api/users

# 篩選出有 summary_printed 互動的用戶
```

---

## 📝 更新日誌

**版本**: 1.1.0
**日期**: 2025-12-03
**更新內容**:
- ✅ 新增防重複列印功能
- ✅ 新增「已領取貼紙」UI 提示
- ✅ 優化列印按鈕顯示邏輯
- ✅ 保留訪客查看證書的能力

**相關檔案**:
- `server.js` - 後端檢查邏輯
- `public/index.html` - 前端 UI 與行為

---

**狀態**: ✅ 已實現並測試

const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const PORT = process.env.PORT || 8084;
const DEVICE_ID = process.env.DEVICE_ID || 'E_SUMMARY_001';
const DEVICE_NAME = process.env.DEVICE_NAME || 'E區體驗總結系統';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 分析用戶互動資料
function analyzeUserData(userData) {
  const interactions = userData.interactions || [];

  // 計算體驗時長
  let experienceDuration = 0;
  if (interactions.length > 0) {
    const times = interactions.map(i => new Date(i.timestamp));
    const firstTime = Math.min(...times);
    const lastTime = Math.max(...times);
    experienceDuration = Math.round((lastTime - firstTime) / 60000); // 分鐘
  }

  // 檢查是否救過人（B區任務成功）
  const savedLife = interactions.some(i =>
    i.actionType === 'mission_success' &&
    i.data?.isCompatible === true
  );

  // 統計各裝置互動次數
  const deviceStats = {};
  interactions.forEach(i => {
    const deviceName = i.deviceName || '未知裝置';
    deviceStats[deviceName] = (deviceStats[deviceName] || 0) + 1;
  });

  // 獲取體驗時間範圍
  const entryTime = new Date(userData.entryTime);
  const lastInteraction = interactions.length > 0
    ? new Date(interactions[interactions.length - 1].timestamp)
    : entryTime;

  return {
    username: userData.username,
    bloodType: userData.bloodType,
    uuid: userData.uuid,
    entryTime: entryTime.toISOString(),
    experienceDuration: experienceDuration,
    totalInteractions: interactions.length,
    savedLife: savedLife,
    deviceStats: deviceStats,
    visitedDevices: Object.keys(deviceStats).length,
    lastInteraction: lastInteraction.toISOString()
  };
}

// QR Code 掃描處理
app.post('/api/scan', async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: '缺少 QR Code 參數'
      });
    }

    const uuid = qrCode;

    // 從主機API獲取用戶資料
    const userResponse = await axios.get(`${API_BASE_URL}/users/${uuid}`);

    if (!userResponse.data.success) {
      return res.status(404).json({
        success: false,
        error: '找不到用戶資料'
      });
    }

    const userData = userResponse.data.data;

    // 檢查是否已經列印過
    const interactions = userData.interactions || [];
    const hasPrinted = interactions.some(i => i.actionType === 'summary_printed');

    // 分析互動資料
    const summary = analyzeUserData(userData);

    // 生成新的 QR Code（包含總結資訊）
    const qrCodeDataUrl = await QRCode.toDataURL(uuid, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

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

    // 發送 Socket.IO 事件通知前端
    io.emit('showSummary', {
      success: true,
      summary: summary,
      qrCode: qrCodeDataUrl,
      hasPrinted: hasPrinted
    });

    res.json({
      success: true,
      data: {
        summary: summary,
        qrCode: qrCodeDataUrl,
        hasPrinted: hasPrinted
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || '處理失敗',
      details: error.message
    });
  }
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log('客戶端連接:', socket.id);

  socket.on('disconnect', () => {
    console.log('客戶端斷開連接:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`═══════════════════════════════════════`);
  console.log(`📊 E區體驗總結系統`);
  console.log(`═══════════════════════════════════════`);
  console.log(`🌐 伺服器運行在 http://localhost:${PORT}`);
  console.log(`🔗 API 主機: ${API_BASE_URL}`);
  console.log(`🎯 裝置ID: ${DEVICE_ID}`);
  console.log(`═══════════════════════════════════════`);
});

const express = require('express');
const axios = require('axios');
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
const PORT = process.env.PORT || 8083;
const DEVICE_ID = process.env.DEVICE_ID || 'D_VIDEO_001';
const DEVICE_NAME = process.env.DEVICE_NAME || 'D區影片系統';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

    // 解析 QR Code (假設就是 UUID)
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

    // 記錄互動到主機API
    const interactionData = {
      deviceId: DEVICE_ID,
      deviceName: DEVICE_NAME,
      actionType: 'video_played',
      data: {
        videoId: 'd_video',
        timestamp: new Date().toISOString()
      }
    };

    await axios.post(
      `${API_BASE_URL}/users/${uuid}/interactions`,
      interactionData
    );

    // 發送 Socket.IO 事件通知前端播放影片
    io.emit('playVideo', {
      success: true,
      userData: {
        username: userData.username,
        bloodType: userData.bloodType,
        uuid: userData.uuid
      }
    });

    res.json({
      success: true,
      data: {
        user: userData,
        message: '影片開始播放'
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
  console.log(`🎬 D區影片系統`);
  console.log(`═══════════════════════════════════════`);
  console.log(`🌐 伺服器運行在 http://localhost:${PORT}`);
  console.log(`🔗 API 主機: ${API_BASE_URL}`);
  console.log(`🎯 裝置ID: ${DEVICE_ID}`);
  console.log(`═══════════════════════════════════════`);
});

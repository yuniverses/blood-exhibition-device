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
const PORT = process.env.PORT || 8081;
const DEVICE_ID = process.env.DEVICE_ID || 'B_MISSION_001';
const DEVICE_NAME = process.env.DEVICE_NAME || 'B區捐血任務系統';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 緊急任務情境資料庫
const emergencyMissions = [
  {
    id: 'mission_001',
    title: '車禍急救',
    description: '一名機車騎士在市區發生車禍，傷勢嚴重，急需大量輸血！',
    patientName: '王先生',
    requiredBloodType: 'A+',
    urgencyLevel: 'critical',
    videoFile: 'emergency_accident.mp4'
  },
  {
    id: 'mission_002',
    title: '手術用血',
    description: '一位孕婦即將進行緊急剖腹產手術，需要備血以防大量出血！',
    patientName: '陳小姐',
    requiredBloodType: 'O+',
    urgencyLevel: 'high',
    videoFile: 'emergency_surgery.mp4'
  },
  {
    id: 'mission_003',
    title: '白血病治療',
    description: '一名年輕的白血病患者正在接受化療，急需血小板輸血！',
    patientName: '李小弟',
    requiredBloodType: 'B+',
    urgencyLevel: 'high',
    videoFile: 'emergency_cancer.mp4'
  },
  {
    id: 'mission_004',
    title: '大量失血',
    description: '工地意外造成工人嚴重外傷，失血過多，生命垂危！',
    patientName: '張師傅',
    requiredBloodType: 'AB+',
    urgencyLevel: 'critical',
    videoFile: 'emergency_trauma.mp4'
  },
  {
    id: 'mission_005',
    title: '產後大出血',
    description: '產婦分娩後出現大出血情況，急需輸血搶救！',
    patientName: '林太太',
    requiredBloodType: 'O-',
    urgencyLevel: 'critical',
    videoFile: 'emergency_birth.mp4'
  },
  {
    id: 'mission_006',
    title: '心臟手術',
    description: '心臟病患者需要進行緊急心臟手術，需要大量備血！',
    patientName: '黃老師',
    requiredBloodType: 'A-',
    urgencyLevel: 'high',
    videoFile: 'emergency_heart.mp4'
  }
];

// 血型相容性檢查
function isBloodTypeCompatible(donorBloodType, requiredBloodType) {
  const compatibilityMap = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };

  return compatibilityMap[donorBloodType]?.includes(requiredBloodType) || false;
}

// 首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 取得隨機任務
app.get('/api/mission/random', (req, res) => {
  const randomMission = emergencyMissions[Math.floor(Math.random() * emergencyMissions.length)];
  res.json({
    success: true,
    data: randomMission
  });
});

// 取得所有任務
app.get('/api/missions', (req, res) => {
  res.json({
    success: true,
    data: emergencyMissions
  });
});

// QR Code 掃描處理
app.post('/api/scan', async (req, res) => {
  try {
    const { qrCode, missionId } = req.body;

    if (!qrCode || !missionId) {
      return res.status(400).json({
        success: false,
        error: '缺少必要參數'
      });
    }

    // 解析 QR Code (假設 QR Code 就是 UUID)
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

    // 找到對應的任務
    const mission = emergencyMissions.find(m => m.id === missionId);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: '找不到任務資料'
      });
    }

    // 檢查血型是否相容
    const isCompatible = isBloodTypeCompatible(userData.bloodType, mission.requiredBloodType);

    // 記錄互動到主機API
    const interactionData = {
      deviceId: DEVICE_ID,
      deviceName: DEVICE_NAME,
      actionType: isCompatible ? 'mission_success' : 'mission_failed',
      data: {
        missionId: mission.id,
        missionTitle: mission.title,
        requiredBloodType: mission.requiredBloodType,
        userBloodType: userData.bloodType,
        isCompatible: isCompatible,
        timestamp: new Date().toISOString()
      }
    };

    await axios.post(
      `${API_BASE_URL}/users/${uuid}/interactions`,
      interactionData
    );

    // 發送 Socket.IO 事件通知前端
    io.emit('scanResult', {
      success: true,
      isCompatible: isCompatible,
      userData: {
        username: userData.username,
        bloodType: userData.bloodType
      },
      mission: mission
    });

    res.json({
      success: true,
      data: {
        isCompatible: isCompatible,
        user: userData,
        mission: mission
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

// 測試用戶列表端點
app.get('/api/test/users', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '無法獲取用戶列表'
    });
  }
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log('客戶端連接:', socket.id);

  // 手動觸發任務（用於測試）
  socket.on('triggerMission', () => {
    const randomMission = emergencyMissions[Math.floor(Math.random() * emergencyMissions.length)];
    io.emit('newMission', randomMission);
  });

  socket.on('disconnect', () => {
    console.log('客戶端斷開連接:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`═══════════════════════════════════════`);
  console.log(`🩸 B區捐血任務系統`);
  console.log(`═══════════════════════════════════════`);
  console.log(`🌐 伺服器運行在 http://localhost:${PORT}`);
  console.log(`📱 互動頁面: http://localhost:${PORT}`);
  console.log(`🔗 API 主機: ${API_BASE_URL}`);
  console.log(`🎯 裝置ID: ${DEVICE_ID}`);
  console.log(`═══════════════════════════════════════`);
});

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
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const bloodTypeContent = {
  'A+': {
    title: 'A 型血',
    content: `在血液的世界裡
最常見的就是 ABO 血型系統

你的血液裡
紅血球表面帶有 A 抗原
所以稱之為 A 型血

在臺灣
大約有 26.6% 的人屬於 A 型血
是第二多的血型哦！`,
    percentage: '26.6%',
    color: '#dc2626'
  },
  'A-': {
    title: 'A- 型血',
    content: `A- 型血是較為罕見的血型

你的血液裡
紅血球表面帶有 A 抗原
但缺少 Rh 因子

在臺灣
只有約 0.3% 的人屬於 A- 型血
非常稀有！`,
    percentage: '0.3%',
    color: '#ef4444'
  },
  'B+': {
    title: 'B 型血',
    content: `在血液的世界裡
B 型血有著獨特的特性

你的血液裡
紅血球表面帶有 B 抗原
所以稱之為 B 型血

在臺灣
大約有 23.9% 的人屬於 B 型血`,
    percentage: '23.9%',
    color: '#dc2626'
  },
  'B-': {
    title: 'B- 型血',
    content: `B- 型血是較為罕見的血型

你的血液裡
紅血球表面帶有 B 抗原
但缺少 Rh 因子

在臺灣
只有約 0.2% 的人屬於 B- 型血
非常稀有！`,
    percentage: '0.2%',
    color: '#ef4444'
  },
  'AB+': {
    title: 'AB 型血',
    content: `AB 型血被稱為萬能受血者

你的血液裡
紅血球表面同時帶有 A 和 B 抗原
是最晚才被發現的血型

在臺灣
大約有 6.0% 的人屬於 AB 型血
相對較少！`,
    percentage: '6.0%',
    color: '#dc2626'
  },
  'AB-': {
    title: 'AB- 型血',
    content: `AB- 型血是最稀有的血型之一

你的血液裡
紅血球表面同時帶有 A 和 B 抗原
但缺少 Rh 因子

在臺灣
只有約 0.1% 的人屬於 AB- 型血
極其罕見！`,
    percentage: '0.1%',
    color: '#ef4444'
  },
  'O+': {
    title: 'O 型血',
    content: `O 型血是最常見的血型

你的血液裡
紅血球表面沒有 A 或 B 抗原
但具有 Rh 因子

在臺灣
大約有 43.6% 的人屬於 O+ 型血
是最多的血型！`,
    percentage: '43.6%',
    color: '#dc2626'
  },
  'O-': {
    title: 'O- 型血',
    content: `O- 型血被稱為萬能捐血者

你的血液裡
紅血球表面沒有 A 或 B 抗原
也沒有 Rh 因子

在臺灣
只有約 0.4% 的人屬於 O- 型血
非常珍貴！`,
    percentage: '0.4%',
    color: '#ef4444'
  }
};

app.get('/input', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'input.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, bloodType } = req.body;

    if (!username || !bloodType) {
      return res.status(400).json({ success: false, error: '請提供姓名和血型' });
    }

    const response = await axios.post(`${API_BASE_URL}/users`, {
      username,
      bloodType
    });

    const userData = response.data.data;
    
    const qrCodeDataUrl = await QRCode.toDataURL(userData.uuid, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    io.emit('newUser', {
      username: userData.username,
      bloodType: userData.bloodType,
      bloodTypeInfo: bloodTypeContent[userData.bloodType],
      uuid: userData.uuid
    });

    res.json({
      success: true,
      data: {
        ...userData,
        qrCode: qrCodeDataUrl,
        bloodTypeInfo: bloodTypeContent[userData.bloodType]
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || '註冊失敗' 
    });
  }
});

app.get('/api/sticker/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    const response = await axios.get(`${API_BASE_URL}/users/${uuid}`);
    const userData = response.data.data;
    
    const qrCodeDataUrl = await QRCode.toDataURL(uuid, {
      width: 300,
      margin: 1
    });

    res.json({
      success: true,
      data: {
        ...userData,
        qrCode: qrCodeDataUrl,
        bloodTypeInfo: bloodTypeContent[userData.bloodType]
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: '無法取得貼紙資料' 
    });
  }
});

io.on('connection', (socket) => {
  console.log('客戶端連接:', socket.id);

  socket.on('disconnect', () => {
    console.log('客戶端斷開連接:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
  console.log(`輸入頁面: http://localhost:${PORT}/input`);
  console.log(`顯示頁面: http://localhost:${PORT}/display`);
});
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const DataManager = require('./dataManager');
const validators = require('./validators');

const app = express();
const PORT = process.env.PORT || 3000;

const dataManager = new DataManager('./database.json');

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedPatterns = [
            /^http:\/\/localhost(:\d+)?$/,
            /^http:\/\/127\.0\.0\.1(:\d+)?$/,
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
            /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/
        ];
        
        const allowed = allowedPatterns.some(pattern => pattern.test(origin));
        
        if (allowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan('dev'));

// 靜態檔案服務
app.use(express.static('public'));

const errorHandler = (res, error, statusCode = 400) => {
    console.error('Error:', error.message);
    res.status(statusCode).json({
        success: false,
        error: error.message
    });
};

const successResponse = (res, data, statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        data
    });
};

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Exhibition Local Database API'
    });
});

app.post('/api/users', async (req, res) => {
    try {
        const validatedData = validators.validateUser(req.body);
        const newUser = await dataManager.create(validatedData);
        successResponse(res, newUser, 201);
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/api/users/batch', async (req, res) => {
    try {
        const validatedData = validators.validateBatchCreate(req.body);
        const newUsers = await dataManager.batchCreate(validatedData);
        successResponse(res, {
            count: newUsers.length,
            users: newUsers
        }, 201);
    } catch (error) {
        errorHandler(res, error);
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await dataManager.findAll();
        successResponse(res, users);
    } catch (error) {
        errorHandler(res, error, 500);
    }
});

app.get('/api/users/:uuid', async (req, res) => {
    try {
        validators.validateUUID(req.params.uuid);
        const user = await dataManager.findByUUID(req.params.uuid);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        successResponse(res, user);
    } catch (error) {
        errorHandler(res, error);
    }
});

app.get('/api/users/search/:field/:value', async (req, res) => {
    try {
        const { field, value } = req.params;
        const users = await dataManager.findByField(field, value);
        successResponse(res, users);
    } catch (error) {
        errorHandler(res, error, 500);
    }
});

app.put('/api/users/:uuid', async (req, res) => {
    try {
        validators.validateUUID(req.params.uuid);
        const validatedData = validators.validateUpdate(req.body);
        const updatedUser = await dataManager.update(req.params.uuid, validatedData);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        successResponse(res, updatedUser);
    } catch (error) {
        errorHandler(res, error);
    }
});

app.patch('/api/users/:uuid', async (req, res) => {
    try {
        validators.validateUUID(req.params.uuid);
        const validatedData = validators.validateUpdate(req.body);
        const updatedUser = await dataManager.update(req.params.uuid, validatedData);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        successResponse(res, updatedUser);
    } catch (error) {
        errorHandler(res, error);
    }
});

app.post('/api/users/:uuid/interactions', async (req, res) => {
    try {
        validators.validateUUID(req.params.uuid);
        const validatedInteraction = validators.validateInteraction(req.body);
        const updatedUser = await dataManager.addInteraction(req.params.uuid, validatedInteraction);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        successResponse(res, updatedUser, 201);
    } catch (error) {
        errorHandler(res, error);
    }
});

app.delete('/api/users/:uuid', async (req, res) => {
    try {
        validators.validateUUID(req.params.uuid);
        const deletedUser = await dataManager.delete(req.params.uuid);
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        successResponse(res, {
            message: 'User deleted successfully',
            user: deletedUser
        });
    } catch (error) {
        errorHandler(res, error);
    }
});

app.get('/api/statistics', async (req, res) => {
    try {
        const stats = await dataManager.getStatistics();
        successResponse(res, stats);
    } catch (error) {
        errorHandler(res, error, 500);
    }
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Exhibition Local Database API Server`);
    console.log(`====================================`);
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://[YOUR_IP]:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`====================================`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
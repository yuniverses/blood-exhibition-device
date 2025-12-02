const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('Exhibition Local Database API Test Suite');
    console.log('========================================\n');
    
    let testUUID = null;
    let testsPassed = 0;
    let testsFailed = 0;

    async function test(name, fn) {
        try {
            console.log(`Testing: ${name}`);
            await fn();
            console.log(`✓ ${name} passed\n`);
            testsPassed++;
        } catch (error) {
            console.error(`✗ ${name} failed: ${error.message}\n`);
            testsFailed++;
        }
    }

    await test('Health Check', async () => {
        const response = await makeRequest('GET', '/health');
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        if (response.data.status !== 'ok') throw new Error('Health check failed');
    });

    await test('Create User', async () => {
        const userData = {
            bloodType: 'A+',
            username: 'TestUser001',
            department: 'Engineering',
            qrCode: 'QR001'
        };
        
        const response = await makeRequest('POST', '/users', userData);
        if (response.status !== 201) throw new Error(`Expected status 201, got ${response.status}`);
        if (!response.data.data.uuid) throw new Error('UUID not generated');
        
        testUUID = response.data.data.uuid;
        console.log(`  Created user with UUID: ${testUUID}`);
    });

    await test('Get User by UUID', async () => {
        const response = await makeRequest('GET', `/users/${testUUID}`);
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        if (response.data.data.uuid !== testUUID) throw new Error('UUID mismatch');
        console.log(`  Retrieved user: ${response.data.data.username}`);
    });

    await test('Update User', async () => {
        const updateData = {
            department: 'Research',
            location: 'Building A'
        };
        
        const response = await makeRequest('PUT', `/users/${testUUID}`, updateData);
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        if (response.data.data.department !== 'Research') throw new Error('Update failed');
        console.log(`  Updated department to: ${response.data.data.department}`);
    });

    await test('Add Interaction', async () => {
        const interaction = {
            deviceId: 'DEVICE001',
            deviceName: 'Interactive Display 1',
            actionType: 'scan',
            data: {
                content: 'Viewed exhibition content',
                duration: 120
            }
        };
        
        const response = await makeRequest('POST', `/users/${testUUID}/interactions`, interaction);
        if (response.status !== 201) throw new Error(`Expected status 201, got ${response.status}`);
        if (response.data.data.interactions.length === 0) throw new Error('Interaction not added');
        console.log(`  Added interaction with device: ${interaction.deviceName}`);
    });

    await test('Batch Create Users', async () => {
        const users = [
            {
                bloodType: 'B+',
                username: 'BatchUser001',
                department: 'Marketing'
            },
            {
                bloodType: 'O-',
                username: 'BatchUser002',
                department: 'Sales'
            }
        ];
        
        const response = await makeRequest('POST', '/users/batch', users);
        if (response.status !== 201) throw new Error(`Expected status 201, got ${response.status}`);
        if (response.data.data.count !== 2) throw new Error('Batch creation failed');
        console.log(`  Created ${response.data.data.count} users in batch`);
    });

    await test('Get All Users', async () => {
        const response = await makeRequest('GET', '/users');
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        if (!Array.isArray(response.data.data)) throw new Error('Expected array of users');
        console.log(`  Total users in database: ${response.data.data.length}`);
    });

    await test('Search by Field', async () => {
        const response = await makeRequest('GET', '/users/search/bloodType/A+');
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        if (!Array.isArray(response.data.data)) throw new Error('Expected array of users');
        console.log(`  Found ${response.data.data.length} users with blood type A+`);
    });

    await test('Get Statistics', async () => {
        const response = await makeRequest('GET', '/statistics');
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        if (typeof response.data.data.totalUsers !== 'number') throw new Error('Invalid statistics format');
        console.log(`  Statistics - Total users: ${response.data.data.totalUsers}, Total interactions: ${response.data.data.totalInteractions}`);
    });

    await test('Delete User', async () => {
        const response = await makeRequest('DELETE', `/users/${testUUID}`);
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        console.log(`  Deleted user: ${response.data.data.user.username}`);
    });

    await test('Verify User Deletion', async () => {
        const response = await makeRequest('GET', `/users/${testUUID}`);
        if (response.status !== 404) throw new Error(`Expected status 404, got ${response.status}`);
        console.log(`  User successfully deleted`);
    });

    console.log('\n========================================');
    console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('========================================');
    
    if (testsFailed > 0) {
        process.exit(1);
    }
}

console.log('Waiting for server to be ready...');
setTimeout(() => {
    runTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}, 2000);
/**
 * Manual API Testing Script
 * 
 * This script tests all authentication APIs without needing Jest or external tools.
 * Run with: node tests/manual-test.js
 * 
 * Make sure:
 * 1. MongoDB is running
 * 2. Backend server is running on port 3000
 * 3. .env file has JWT_SECRET and MONGODB_URI configured
 */

const http = require('http');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Test data
const testUser = {
    username: 'testuser' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'TestPassword@123'
};

let authToken = null;
let cookies = [];

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add cookies to request if they exist
        if (cookies.length > 0) {
            options.headers['Cookie'] = cookies.join('; ');
        }

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                // Extract and store cookies from Set-Cookie header
                const setCookieHeaders = res.headers['set-cookie'];
                if (setCookieHeaders) {
                    cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]);
                }

                const response = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data ? JSON.parse(data) : null,
                    success: res.statusCode >= 200 && res.statusCode < 300
                };

                resolve(response);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

// Test functions
async function testRegister() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 1: Register API');
    console.log('='.repeat(50));
    
    console.log('Request:', {
        method: 'POST',
        path: '/api/auth/register',
        body: testUser
    });

    try {
        const response = await makeRequest('POST', '/api/auth/register', testUser);
        
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
        
        if (response.success) {
            console.log('✓ Register test PASSED');
            return true;
        } else {
            console.log('✗ Register test FAILED');
            return false;
        }
    } catch (error) {
        console.error('✗ Register test ERROR:', error.message);
        return false;
    }
}

async function testLogin() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 2: Login API');
    console.log('='.repeat(50));
    
    const loginData = {
        email: testUser.email,
        password: testUser.password
    };

    console.log('Request:', {
        method: 'POST',
        path: '/api/auth/login',
        body: loginData
    });

    try {
        const response = await makeRequest('POST', '/api/auth/login', loginData);
        
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
        console.log('Cookies Set:', cookies);
        
        if (response.success && response.body.user) {
            authToken = response.body.user.id;
            console.log('✓ Login test PASSED');
            return true;
        } else {
            console.log('✗ Login test FAILED');
            return false;
        }
    } catch (error) {
        console.error('✗ Login test ERROR:', error.message);
        return false;
    }
}

async function testGetMe() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 3: Get Me API (Authenticated)');
    console.log('='.repeat(50));
    
    console.log('Request:', {
        method: 'GET',
        path: '/api/auth/get-me',
        headers: {
            'Cookie': cookies.length > 0 ? cookies.join('; ') : 'No cookies'
        }
    });

    try {
        const response = await makeRequest('GET', '/api/auth/get-me');
        
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
        
        if (response.success && response.body.user) {
            console.log('✓ Get Me test PASSED');
            return true;
        } else {
            console.log('✗ Get Me test FAILED');
            return false;
        }
    } catch (error) {
        console.error('✗ Get Me test ERROR:', error.message);
        return false;
    }
}

async function testLogout() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 4: Logout API');
    console.log('='.repeat(50));
    
    console.log('Request:', {
        method: 'GET',
        path: '/api/auth/logout',
        headers: {
            'Cookie': cookies.length > 0 ? cookies.join('; ') : 'No cookies'
        }
    });

    try {
        const response = await makeRequest('GET', '/api/auth/logout');
        
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
        
        if (response.success) {
            console.log('✓ Logout test PASSED');
            return true;
        } else {
            console.log('✗ Logout test FAILED');
            return false;
        }
    } catch (error) {
        console.error('✗ Logout test ERROR:', error.message);
        return false;
    }
}

async function testGetMeAfterLogout() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 5: Get Me API After Logout (Should Fail)');
    console.log('='.repeat(50));
    
    console.log('Request:', {
        method: 'GET',
        path: '/api/auth/get-me',
        headers: {
            'Cookie': cookies.length > 0 ? cookies.join('; ') : 'No cookies'
        }
    });

    try {
        const response = await makeRequest('GET', '/api/auth/get-me');
        
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
        
        // Should return 401 since token is blacklisted
        if (response.statusCode === 401) {
            console.log('✓ Get Me After Logout test PASSED (correctly rejected)');
            return true;
        } else {
            console.log('✗ Get Me After Logout test FAILED (should have been rejected)');
            return false;
        }
    } catch (error) {
        console.error('✗ Get Me After Logout test ERROR:', error.message);
        return false;
    }
}

async function testLoginWithInvalidPassword() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST 6: Login with Invalid Password');
    console.log('='.repeat(50));
    
    const loginData = {
        email: testUser.email,
        password: 'WrongPassword@123'
    };

    console.log('Request:', {
        method: 'POST',
        path: '/api/auth/login',
        body: loginData
    });

    try {
        const response = await makeRequest('POST', '/api/auth/login', loginData);
        
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
        
        // Should return 400 for invalid password
        if (response.statusCode === 400) {
            console.log('✓ Invalid Password test PASSED (correctly rejected)');
            return true;
        } else {
            console.log('✗ Invalid Password test FAILED');
            return false;
        }
    } catch (error) {
        console.error('✗ Invalid Password test ERROR:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║       AUTHENTICATION API TEST SUITE             ║');
    console.log('║            (Manual Testing Script)              ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`\nTesting user: ${testUser.email}`);
    console.log(`\nServer URL: ${BASE_URL}`);
    console.log('\nMake sure:');
    console.log('1. MongoDB is running');
    console.log('2. Backend server is running on port 3000');
    console.log('3. .env file is properly configured');

    const results = [];

    // Run tests in sequence
    results.push(await testRegister());
    results.push(await testLogin());
    results.push(await testGetMe());
    results.push(await testLogout());
    results.push(await testGetMeAfterLogout());
    results.push(await testLoginWithInvalidPassword());

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    
    if (passed === total) {
        console.log('\n✓ ALL TESTS PASSED! 🎉');
    } else {
        console.log('\n✗ SOME TESTS FAILED');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
}

// Run all tests
runAllTests().catch(console.error);

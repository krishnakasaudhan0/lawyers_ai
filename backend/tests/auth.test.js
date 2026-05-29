const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Create a test app
const app = express();
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/auth.routes');

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Test data
const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPassword123'
};

const testUserLogin = {
    email: 'test@example.com',
    password: 'TestPassword123'
};

// Test suite
describe('Authentication APIs', () => {
    let authToken;
    let userCookie;

    // Connect to test database before all tests
    beforeAll(async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawgpt-test');
        } catch (error) {
            console.log('Database connection error:', error.message);
        }
    });

    // Disconnect after all tests
    afterAll(async () => {
        try {
            // Clean up test data
            const User = require('../models/user.model');
            await User.deleteMany({ email: testUser.email });
            
            await mongoose.connection.close();
        } catch (error) {
            console.log('Cleanup error:', error.message);
        }
    });

    // Test Register API
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).toHaveProperty('username', testUser.username);
            expect(response.body.user).toHaveProperty('email', testUser.email);
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should reject registration if email already exists', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);

            expect(response.body).toHaveProperty('message', 'user already exists');
        });

        it('should reject registration with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test2@example.com' })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Please provide');
        });

        it('should reject registration with missing password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test2@example.com'
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
        });
    });

    // Test Login API
    describe('POST /api/auth/login', () => {
        it('should login user successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send(testUserLogin)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'User logged in successfully');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).toHaveProperty('username', testUser.username);
            expect(response.body.user).toHaveProperty('email', testUser.email);
            
            // Store cookie for later use
            const setCookieHeader = response.headers['set-cookie'];
            if (setCookieHeader) {
                userCookie = setCookieHeader[0];
            }
        });

        it('should reject login with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid@example.com',
                    password: 'TestPassword123'
                })
                .expect(400);

            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });

        it('should reject login with wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123'
                })
                .expect(400);

            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });

        it('should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Please provide');
        });
    });

    // Test Get Me API
    describe('GET /api/auth/get-me', () => {
        it('should get authenticated user details', async () => {
            // First login to get a valid token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send(testUserLogin);

            const response = await request(app)
                .get('/api/auth/get-me')
                .set('Cookie', loginResponse.headers['set-cookie'])
                .expect(200);

            expect(response.body).toHaveProperty('message', 'User details fetched successfully');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).toHaveProperty('username', testUser.username);
            expect(response.body.user).toHaveProperty('email', testUser.email);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should reject request without authentication token', async () => {
            const response = await request(app)
                .get('/api/auth/get-me')
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/get-me')
                .set('Cookie', 'token=invalid_token')
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });
    });

    // Test Logout API
    describe('GET /api/auth/logout', () => {
        it('should logout user successfully', async () => {
            // First login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send(testUserLogin);

            // Then logout
            const response = await request(app)
                .get('/api/auth/logout')
                .set('Cookie', loginResponse.headers['set-cookie'])
                .expect(200);

            expect(response.body).toHaveProperty('message', 'User logged out successfully');
        });

        it('should reject logout without token', async () => {
            const response = await request(app)
                .get('/api/auth/logout')
                .expect(400);

            expect(response.body).toHaveProperty('message', 'No token provided');
        });

        it('should clear the auth cookie on logout', async () => {
            // First login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send(testUserLogin);

            // Then logout
            const response = await request(app)
                .get('/api/auth/logout')
                .set('Cookie', loginResponse.headers['set-cookie']);

            // Check if cookie is cleared
            const setCookieHeader = response.headers['set-cookie'];
            expect(setCookieHeader).toBeDefined();
            expect(setCookieHeader[0]).toContain('token=');
        });
    });
});

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock Gemini Service
jest.mock('../services/google.services', () => ({
    getResponsefromGemini: jest.fn().mockResolvedValue('Mock Legal Assistant Response with Sections and Acts.')
}));

const app = express();
const cookieParser = require('cookie-parser');
const chatRoutes = require('../routes/chat.routes');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');

app.use(express.json());
app.use(cookieParser());

// Mock auth middleware for simplicity or just run with real JWT
app.use('/api/chat', chatRoutes);

const testUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'testchatuser',
    email: 'chatuser@test.com'
};

describe('Chat and Message APIs', () => {
    let token;
    let authCookie;
    let activeSessionId;

    beforeAll(async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawgpt-test');
            
            // Create user in the database
            await User.create({
                _id: testUser._id,
                username: testUser.username,
                email: testUser.email,
                password: 'hashedPassword123'
            });

            // Generate token matching format in auth.controller
            token = jwt.sign(
                { id: testUser._id.toString(), username: testUser.username },
                process.env.JWT_SECRET || 'testsecret',
                { expiresIn: '1d' }
            );
            authCookie = `token=${token}`;
        } catch (error) {
            console.log('Setup error:', error.message);
        }
    });

    afterAll(async () => {
        try {
            await User.deleteMany({ email: testUser.email });
            await Chat.deleteMany({ userId: testUser._id });
            if (activeSessionId) {
                await Message.deleteMany({ sessionId: activeSessionId });
            }
            await mongoose.connection.close();
        } catch (error) {
            console.log('Cleanup error:', error.message);
        }
    });

    describe('POST /api/chat/new', () => {
        it('should require authentication', async () => {
            await request(app)
                .post('/api/chat/new')
                .send({ title: 'Tenant Dispute' })
                .expect(401);
        });

        it('should successfully create a new chat session when authenticated', async () => {
            const res = await request(app)
                .post('/api/chat/new')
                .set('Cookie', [authCookie])
                .send({ title: 'New Consultation' })
                .expect(201);

            expect(res.body).toHaveProperty('message', 'Chat session created successfully');
            expect(res.body).toHaveProperty('session');
            expect(res.body.session).toHaveProperty('userId', testUser._id.toString());
            expect(res.body.session).toHaveProperty('title', 'New Consultation');
            expect(res.body.session).toHaveProperty('status', 'active');

            activeSessionId = res.body.session._id;
        });
    });

    describe('GET /api/chat/sessions', () => {
        it('should list all sessions for the user', async () => {
            const res = await request(app)
                .get('/api/chat/sessions')
                .set('Cookie', [authCookie])
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body[0]).toHaveProperty('_id', activeSessionId);
        });
    });

    describe('GET /api/chat/sessions/:id', () => {
        it('should retrieve a session by ID', async () => {
            const res = await request(app)
                .get(`/api/chat/sessions/${activeSessionId}`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body).toHaveProperty('_id', activeSessionId);
            expect(res.body).toHaveProperty('title', 'New Consultation');
        });

        it('should return 404 if session does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/chat/sessions/${fakeId}`)
                .set('Cookie', [authCookie])
                .expect(404);
        });
    });

    describe('POST /api/chat/sessions/:id/messages', () => {
        it('should add a user message and trigger mocked Gemini response', async () => {
            const userMsg = {
                content: 'How do I handle an illegal eviction by my landlord?',
                sender: 'user'
            };

            const res = await request(app)
                .post(`/api/chat/sessions/${activeSessionId}/messages`)
                .set('Cookie', [authCookie])
                .send(userMsg)
                .expect(201);

            expect(res.body).toHaveProperty('userMessage');
            expect(res.body).toHaveProperty('assistantMessage');
            expect(res.body.userMessage).toHaveProperty('content', userMsg.content);
            expect(res.body.userMessage).toHaveProperty('sender', 'user');
            expect(res.body.assistantMessage).toHaveProperty('content', 'Mock Legal Assistant Response with Sections and Acts.');
            expect(res.body.assistantMessage).toHaveProperty('sender', 'assistant');

            // Session title should update because it was "New Consultation"
            const updatedSessionRes = await request(app)
                .get(`/api/chat/sessions/${activeSessionId}`)
                .set('Cookie', [authCookie]);

            expect(updatedSessionRes.body.title).not.toBe('New Consultation');
            expect(updatedSessionRes.body.title).toContain('How do I handle');
        });

        it('should fail if required fields are missing', async () => {
            await request(app)
                .post(`/api/chat/sessions/${activeSessionId}/messages`)
                .set('Cookie', [authCookie])
                .send({ content: 'Only content' })
                .expect(400);
        });
    });

    describe('GET /api/chat/sessions/:id/messages', () => {
        it('should fetch the message history', async () => {
            const res = await request(app)
                .get(`/api/chat/sessions/${activeSessionId}/messages`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2); // One user message + one assistant response
            expect(res.body[0].sender).toBe('user');
            expect(res.body[1].sender).toBe('assistant');
        });
    });

    describe('POST /api/chat/sessions/:id/archive', () => {
        it('should successfully archive the session', async () => {
            const res = await request(app)
                .post(`/api/chat/sessions/${activeSessionId}/archive`)
                .set('Cookie', [authCookie])
                .expect(200);

            expect(res.body).toHaveProperty('message', 'Chat session archived successfully');
            expect(res.body.session).toHaveProperty('status', 'archived');
        });
    });
});

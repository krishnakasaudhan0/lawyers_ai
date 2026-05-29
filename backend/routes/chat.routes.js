const express = require('express');
const chatRouter = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
    newchatcontroller,
    getallsessionscontroller,
    getsessionbyidcontroller,
    addmessagecontroller,
    getmessagesbyidcontroller,
    archivechatcontroller
} = require('../controller/chat.controller');

// Chat Session Routes
chatRouter.post('/new', authMiddleware, newchatcontroller);
chatRouter.get('/sessions', authMiddleware, getallsessionscontroller);
chatRouter.get('/sessions/:id', authMiddleware, getsessionbyidcontroller);

// Message Routes
chatRouter.post('/sessions/:id/messages', authMiddleware, addmessagecontroller);
chatRouter.get('/sessions/:id/messages', authMiddleware, getmessagesbyidcontroller);
chatRouter.post('/sessions/:id/archive', authMiddleware, archivechatcontroller);

module.exports = chatRouter;
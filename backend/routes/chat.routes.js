const express=require('express');
const chatRouter=express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {newchatcontroller}=require('../controller/chat.controller');


chatRouter.post('/new',authMiddleware,newchatcontroller);
chatRouter.get('/sessions',authMiddleware,getallsessionscontroller);
chatRouter.get('/sessions/:id',authMiddleware,getsessionbyidcontroller);


chatRouter.post('/sessions/:id/messages',authMiddleware,addmessagecontroller);
chatRouter.get('/sessions/:id/messages',authMiddleware,getmessagesbyidcontroller);
chatRouter.post('/sessions/:id/archive',authMiddleware,archivechatcontroller);

export default chatRouter;
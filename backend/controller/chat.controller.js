const chatmodel = require('../models/chat.model');
const messagemodel = require('../models/message.model');
const { getResponsefromGemini } = require('../services/google.services');

/**
 * @objective Create a new chat session for the authenticated user.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function newchatcontroller(req, res) {
    try {
        const userId = req.user.id; // Corrected: decoded token payload has id, not _id
        const title = req.body.title || 'New Consultation';
        
        const chatsession = await chatmodel.create({
            userId,
            title,
            status: 'active'
        });
        
        return res.status(201).json({
            message: 'Chat session created successfully',
            session: chatsession
        });
    } catch (err) {
        console.error('Error creating chat session:', err);
        res.status(500).json({ message: 'Failed to create chat session' });
    }
}
/**
 * @objective Fetch all chat sessions for the authenticated user, sorted by most recent.
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function getallsessionscontroller(req, res) {
    try {
        const userId = req.user.id; // Corrected from req.user._id to req.user.id
        const sessions = await chatmodel.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(sessions);
    } catch (err) {
        console.error('Error fetching chat sessions:', err);
        res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
}

async function getsessionbyidcontroller(req, res) {
    try {
        const sessionId = req.params.id;
        const session = await chatmodel.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        if (session.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.status(200).json(session);
    } catch (err) {
        console.error('Error fetching chat session:', err);
        res.status(500).json({ message: 'Failed to fetch chat session' });
    }
}

// Gemini entry point for messages
async function addmessagecontroller(req, res) {
    const { content, sender, tokenCount } = req.body;
    const sessionId = req.params.id;

    // Validate input
    if (!content || !sender) {
        return res.status(400).json({ message: 'Content and sender are required' });
    }

    try {
        // Check if chat session exists and belongs to the user
        const chatSession = await chatmodel.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        if (chatSession.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Create new user message
        const newMessage = await messagemodel.create({
            sessionId,
            sender,
            content,
            tokenCount: tokenCount || 0
        });

        // Auto-generate title from first message if title is default 'New Consultation'
        const messageCount = await messagemodel.countDocuments({ sessionId, sender: 'user' });
        if (messageCount === 1 && chatSession.title === 'New Consultation') {
            chatSession.title = content.substring(0, 35) + (content.length > 35 ? '...' : '');
            await chatSession.save();
        }

        // Get context from chat history
        const chathistory = await messagemodel.find({ sessionId }).sort({ createdAt: 1 });
        const prompt = chathistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n');
        
        // Query Gemini
        const responseFromGemini = await getResponsefromGemini(prompt);
        
        // Save assistant response
        const assistantMessage = await messagemodel.create({
            sessionId,
            sender: 'assistant',
            content: responseFromGemini,
            tokenCount: 0
        });

        res.status(201).json({
            userMessage: newMessage,
            assistantMessage: assistantMessage
        });
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({ message: 'Failed to add message' });
    }
}

async function getmessagesbyidcontroller(req, res) {
    const sessionId = req.params.id;
    try {
        // Check if chat session exists and belongs to the user
        const chatSession = await chatmodel.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        if (chatSession.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Fetch messages for the chat session
        const messages = await messagemodel.find({ sessionId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
}

async function archivechatcontroller(req, res) {
    const sessionId = req.params.id;
    try {
        const chatSession = await chatmodel.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        if (chatSession.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        chatSession.status = 'archived';
        await chatSession.save();
        res.status(200).json({ message: 'Chat session archived successfully', session: chatSession });
    } catch (err) {
        console.error('Error archiving chat session:', err);
        res.status(500).json({ message: 'Failed to archive chat session' });
    }
}

module.exports = {
    newchatcontroller,
    getallsessionscontroller,
    getsessionbyidcontroller,
    addmessagecontroller,
    getmessagesbyidcontroller,
    archivechatcontroller
};
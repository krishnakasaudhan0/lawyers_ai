const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LEGAL_QUERY_SYSTEM_PROMPT = `You are an AI legal assistant specialized in Indian law.
Explain legal concepts clearly in simple language.
If possible reference relevant laws, acts, or constitutional articles.
Do not give professional legal advice.`;

const CONTRACT_SCANNER_PROMPT = `Analyze the following contract text and identify potentially risky clauses.
For each risk explain:
1. Clause name
2. Why it may be risky
3. A safer alternative suggestion.

Contract Text to Analyze:
`;

const DOCUMENT_GENERATOR_PROMPT = `You are a legal document generator.
Generate a well-structured legal document based on the user's request.
Use headings and numbered sections.

Request:
`;

async function extractTextFromFile(file) {
    if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value;
    } else if (file.mimetype === 'text/plain') {
        return file.buffer.toString('utf8');
    } else {
        throw new Error('Unsupported file type');
    }
}

// @route   POST /api/chat/legal-query
// @desc    Process legal query
// @access  Private
router.post('/legal-query', auth, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: LEGAL_QUERY_SYSTEM_PROMPT
        });
        
        const result = await model.generateContent(query);
        const text = result.response.text();

        // Save to chat history
        const chat = new Chat({
            userId: req.user.id,
            mode: 'query',
            userMessage: query,
            aiMessage: text
        });
        await chat.save();
        
        res.json({ answer: text });
    } catch (error) {
        console.error('Error in /legal-query:', error);
        res.status(500).json({ error: 'Failed to process legal query' });
    }
});

// @route   POST /api/chat/scan-contract
// @desc    Scan contract for risks
// @access  Private
router.post('/scan-contract', auth, upload.single('contract'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const text = await extractTextFromFile(req.file);
        const { instructions } = req.body;
        
        let promptToEnrich = CONTRACT_SCANNER_PROMPT + "\n" + text;
        if (instructions) {
            promptToEnrich += "\n\nUser Instructions: " + instructions;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(promptToEnrich);
        const aiResponseText = result.response.text();

        // Save to chat history
        const chat = new Chat({
            userId: req.user.id,
            mode: 'scan',
            userMessage: `Scanned file: ${req.file.originalname}` + (instructions ? `\nInstructions: ${instructions}` : ''),
            aiMessage: aiResponseText
        });
        await chat.save();
        
        res.json({ analysis: aiResponseText });
    } catch (error) {
        console.error('Error in /scan-contract:', error);
        res.status(500).json({ error: 'Failed to analyze contract' });
    }
});

// @route   POST /api/chat/generate-document
// @desc    Generate legal document
// @access  Private
router.post('/generate-document', auth, async (req, res) => {
    try {
        const { request } = req.body;
        if (!request) return res.status(400).json({ error: 'Request is required' });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(DOCUMENT_GENERATOR_PROMPT + "\n" + request);
        const text = result.response.text();

        // Save to chat history
        const chat = new Chat({
            userId: req.user.id,
            mode: 'generate',
            userMessage: request,
            aiMessage: text
        });
        await chat.save();
        
        res.json({ document: text });
    } catch (error) {
        console.error('Error in /generate-document:', error);
        res.status(500).json({ error: 'Failed to generate document' });
    }
});

// @route   GET /api/chat/history
// @desc    Get user's chat history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user.id }).sort({ timestamp: 1 });
        res.json(chats);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/chat/history
// @desc    Clear user's chat history
// @access  Private
router.delete('/history', auth, async (req, res) => {
    try {
        await Chat.deleteMany({ userId: req.user.id });
        res.json({ msg: 'Chat history cleared' });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

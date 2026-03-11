const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mode: {
        type: String,
        required: true
    },
    userMessage: {
        type: String,
        required: true
    },
    aiMessage: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chat', ChatSchema);

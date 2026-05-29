const mongoose = require('mongoose');



/**
 * `sessionId`: ObjectId (references the corresponding `ChatSession`).
  * `sender`: Enum (`user`, `assistant`).
  * `content`: String (the markdown-formatted text).
  * `tokenCount`: Optional Number (to track LLM cost and billing).
  * `timestamps`: Created date.
 */
const messageSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    tokenCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const MessageModel = mongoose.model('Message', messageSchema);
module.exports = MessageModel;  

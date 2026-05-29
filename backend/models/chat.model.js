const mongoose = require('mongoose');

/**
 * `userId`: MongoDB ObjectId (references the authenticated user).
  * `title`: String (auto-generated from the first message, e.g., "Landlord Dispute Consultation").
  * `status`: Enum (`active`, `archived`).
  * `timestamps`: Created & Updated dates.
 */
const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

const ChatModel = mongoose.model('Chat', chatSchema);
module.exports = ChatModel;

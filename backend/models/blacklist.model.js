const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, 'Token is required' ]
    }
},{ timestamps: true });

blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // auto-delete after 1 day

const BlacklistModel = mongoose.model('Blacklist', blacklistSchema);

module.exports = BlacklistModel;
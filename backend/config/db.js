const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
    if (isConnected || mongoose.connection.readyState === 1) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        const dbURI = process.env.MONGO_DB_URI || process.env.MONGODB_URI;
        if (!dbURI) { throw new Error('MONGO_DB_URI environment variable is not set'); }
        await mongoose.connect(dbURI);
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
            process.exit(1); // Exit the process with an error code locally
        }
        throw error;
    }
}

module.exports = connectDB;
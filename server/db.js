const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('MongoDB is already connected');
        return;
    }

    if (!process.env.MONGO_URI) {
        console.error('FATAL ERROR: MONGO_URI environment variable is missing.');
        throw new Error('MONGO_URI is undefined. Please add it to your Vercel Environment Variables.');
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI);

        isConnected = db.connections[0].readyState === 1;

        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        throw err;
    }
};

module.exports = connectDB;
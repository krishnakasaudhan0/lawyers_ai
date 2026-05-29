const mongoose = require('mongoose');
require('dotenv').config();


async function connectDB() {
    try {
        const dbURI = process.env.MONGO_DB_URI || process.env.MONGODB_URI;
        if (!dbURI) { throw new Error('MONGO_DB_URI environment variable is not set'); }
        await mongoose.connect(dbURI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with an error code
    }
}

module.exports = connectDB;
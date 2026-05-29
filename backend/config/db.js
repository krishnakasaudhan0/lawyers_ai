const mongoose = require('mongoose');
require('dotenv').config();


async function connectDB() {
    try {
        await mongoose.connect("mongodb+srv://kasaudhankrishna05_db_user:1CGda8iUBoqw7ilo@krishna.hkhes2p.mongodb.net/lawyersai");
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with an error code
    }
}

module.exports = connectDB;
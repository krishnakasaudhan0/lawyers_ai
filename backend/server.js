const express = require('express');
require('dotenv').config();
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');


// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Define routes

app.use('/api/auth', authRoutes);

app.use('/api/chat', chatRoutes);

// Start the server





const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
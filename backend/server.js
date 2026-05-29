const express = require('express');
require('dotenv').config();
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Define routes

app.use('/api/auth', authRoutes);
// Start the server





app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})
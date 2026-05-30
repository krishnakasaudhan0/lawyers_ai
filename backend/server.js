const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const app = express();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');


// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Define routes

app.use('/api/auth', authRoutes);

app.use('/api/chat', chatRoutes);

// Serve static assets in production or on Render (outside of Vercel serverless)
if (process.env.NODE_ENV === 'production' || process.env.RENDER || !process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, '../public')));
    
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    });
}

// Start the server
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
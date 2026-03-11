const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`LawGPT server running at http://localhost:${port}`);
    });
}

module.exports = app;

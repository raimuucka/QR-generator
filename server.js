require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);

// Fallback to index.html for SPA-like routing (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
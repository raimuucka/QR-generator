require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);

// QR Redirect Route
app.get('/qr/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT destination FROM qr_codes WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            return res.status(404).send('QR code not found');
        }
        // Serve a simple page with logo and redirect
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <meta charset="UTF-8">
      </head>
      <body>
        <div style="text-align: center; padding: 20px;">
          <img src="https://via.placeholder.com/150" alt="Your Logo" style="max-width: 150px;">
          <p>Redirecting in 2 seconds...</p>
        </div>
        <script>
          setTimeout(() => { window.location.href = '${row.destination}'; }, 2000);
        </script>
      </body>
      </html>
    `);
    });
});

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
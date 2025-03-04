const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const db = require('../config/db');
const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get Dashboard
router.get('/dashboard', authMiddleware, (req, res) => {
  db.all(
    'SELECT id, destination, qrImage, qrSVG, createdAt FROM qr_codes WHERE userId = ?',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt * 1000).toISOString(), // Convert Unix timestamp to ISO
      })));
    }
  );
});

// Create QR Code
router.post('/create', authMiddleware, async (req, res) => {
  const { destination } = req.body;
  try {
    const qrImage = await QRCode.toDataURL(destination, { errorCorrectionLevel: 'H' });
    const qrSVG = await QRCode.toString(destination, { type: 'svg', errorCorrectionLevel: 'H' });

    db.run(
      'INSERT INTO qr_codes (userId, destination, qrImage, qrSVG) VALUES (?, ?, ?, ?)',
      [req.user.id, destination, qrImage, qrSVG],
      function (err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ id: this.lastID, destination, qrImage, qrSVG, createdAt: new Date().toISOString() });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Tutorial
router.get('/tutorial', (req, res) => {
  res.json({
    tutorial: `
      ### QR Code Generation Tutorial
      1. **Login**: Use your credentials to access the dashboard.
      2. **Create a QR Code**:
         - Click "Create New QR Code" on the dashboard.
         - Enter the destination URL (e.g., https://example.com).
         - Submit to generate your QR code.
      3. **Download Formats**:
         - **PNG**: Raster image, widely supported (e.g., for web or print).
         - **SVG**: Vector format, scalable without quality loss (ideal for logos or large prints).
      4. **View Stats**: Check creation date and destination on the dashboard.
    `,
  });
});

module.exports = router;
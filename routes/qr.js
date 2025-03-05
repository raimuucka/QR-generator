const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const sharp = require('sharp'); // For image conversion
const db = require('../config/db');
const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Utility function to convert SVG to PNG data URL with specified size
async function convertSvgToPng(svgString, width = 300) {
    try {
        // Convert SVG to Buffer
        const svgBuffer = Buffer.from(svgString);

        // Convert to PNG with specified size
        const pngBuffer = await sharp(svgBuffer)
            .resize(width, width) // Resize to 300x300 pixels
            .png()
            .toBuffer();
        const pngDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

        return pngDataUrl;
    } catch (err) {
        console.error('Error converting SVG to PNG:', err);
        throw err;
    }
}

// Get Dashboard
router.get('/dashboard', authMiddleware, (req, res) => {
    db.all(
        'SELECT id, destination, qrImage, qrSVG, createdAt FROM qr_codes WHERE userId = ?',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json(
                rows.map((row) => ({
                    ...row,
                    createdAt: new Date(row.createdAt * 1000).toISOString(),
                }))
            );
        }
    );
});

// Create QR Code (Preview Only)
router.post('/create', authMiddleware, async (req, res) => {
    const { destination } = req.body;
    try {
        console.log('Generating QR for destination:', destination); // Debug log
        // Generate SVG QR code
        const rawSvg = await QRCode.toString(`http://localhost:3000/qr/temp-${Date.now()}`, {
            type: 'svg',
            errorCorrectionLevel: 'H',
        });
        const qrSVG = `data:image/svg+xml;base64,${Buffer.from(rawSvg).toString('base64')}`;

        // Convert SVG to PNG with 300x300 size
        const qrImage = await convertSvgToPng(rawSvg, 300);

        console.log('Generated QR data:', {
            qrSVG: qrSVG.substring(0, 100) + '...',
            qrImage: qrImage.substring(0, 100) + '...',
        }); // Debug log
        res.json({ destination, qrImage, qrSVG });
    } catch (err) {
        console.error('Error generating QR:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save QR Code
router.post('/save', authMiddleware, async (req, res) => {
    const { destination } = req.body;
    try {
        db.run(
            'INSERT INTO qr_codes (userId, destination) VALUES (?, ?)',
            [req.user.id, destination],
            async function (err) {
                if (err) return res.status(500).json({ message: 'Server error' });
                const qrId = this.lastID;
                // Generate SVG QR code
                const rawSvg = await QRCode.toString(`http://localhost:3000/qr/${qrId}`, {
                    type: 'svg',
                    errorCorrectionLevel: 'H',
                });
                const qrSVG = `data:image/svg+xml;base64,${Buffer.from(rawSvg).toString('base64')}`;

                // Convert SVG to PNG with 300x300 size
                const qrImage = await convertSvgToPng(rawSvg, 300);

                db.run(
                    'UPDATE qr_codes SET qrImage = ?, qrSVG = ? WHERE id = ?',
                    [qrImage, qrSVG, qrId],
                    (err) => {
                        if (err) return res.status(500).json({ message: 'Server error' });
                        res.json({ id: qrId, destination, qrImage, qrSVG });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete QR Code
router.delete('/delete/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    db.run(
        'DELETE FROM qr_codes WHERE id = ? AND userId = ?',
        [id, req.user.id],
        function (err) {
            if (err || this.changes === 0) {
                return res.status(404).json({ message: 'QR code not found or unauthorized' });
            }
            res.json({ message: 'QR code deleted' });
        }
    );
});

// Edit QR Code
router.put('/edit/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { destination } = req.body;
    try {
        // Generate SVG QR code
        const rawSvg = await QRCode.toString(`http://localhost:3000/qr/${id}`, {
            type: 'svg',
            errorCorrectionLevel: 'H',
        });
        const qrSVG = `data:image/svg+xml;base64,${Buffer.from(rawSvg).toString('base64')}`;

        // Convert SVG to PNG with 300x300 size
        const qrImage = await convertSvgToPng(rawSvg, 300);

        db.run(
            'UPDATE qr_codes SET destination = ?, qrImage = ?, qrSVG = ? WHERE id = ? AND userId = ?',
            [destination, qrImage, qrSVG, id, req.user.id],
            function (err) {
                if (err || this.changes === 0) {
                    return res.status(404).json({ message: 'QR code not found or unauthorized' });
                }
                res.json({ id, destination, qrImage, qrSVG });
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
         - Preview the QR code, then click "Save" to store it.
      3. **Download Formats**:
         - **SVG**: Vector format, scalable without quality loss.
         - **PNG**: Raster image, widely supported (300x300 px).
      4. **Edit/Delete**: Use the buttons on the dashboard to modify or remove QR codes.
    `,
    });
});

module.exports = router;
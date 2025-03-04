const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination: { type: String, required: true },
  qrImage: String, // Base64 or URL to PNG
  qrSVG: String, // SVG string
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QRCode', qrCodeSchema);
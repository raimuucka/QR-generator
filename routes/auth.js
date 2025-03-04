const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Register
router.post('/register', (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;
  if (password !== passwordConfirm) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hash],
      function (err) {
        if (err) {
          return res.status(400).json({ message: 'User already exists' });
        }
        const token = jwt.sign({ id: this.lastID }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
      }
    );
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Forgot Password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const expiry = Date.now() + 15 * 60 * 1000;

    db.run(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      [resetToken, expiry, user.id],
      (err) => {
        if (err) return res.status(500).json({ message: 'Server error' });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset',
          text: `Click to reset: http://localhost:3000/reset-password/${resetToken}`,
        };
        transporter.sendMail(mailOptions, (err) => {
          if (err) return res.status(500).json({ message: 'Email error' });
          res.json({ message: 'Reset link sent' });
        });
      }
    );
  });
});

// Reset Password
router.post('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (password !== passwordConfirm) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  db.get(
    'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?',
    [token, Date.now()],
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Server error' });

        db.run(
          'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
          [hash, user.id],
          (err) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Password reset successfully' });
          }
        );
      });
    }
  );
});

module.exports = router;
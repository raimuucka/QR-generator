const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../', process.env.DB_PATH);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Create Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      resetToken TEXT,
      resetTokenExpiry INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS qr_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      destination TEXT NOT NULL,
      qrImage TEXT,
      qrSVG TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
});

module.exports = db;
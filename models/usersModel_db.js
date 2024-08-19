const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./delivery.db');



db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        admin BOOLEAN NOT NULL CHECK (admin IN (0, 1))
    )`);
});

module.exports = db;

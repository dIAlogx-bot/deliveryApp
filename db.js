const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./delivery.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados delivery SQLite.');
    }
});

module.exports = db;

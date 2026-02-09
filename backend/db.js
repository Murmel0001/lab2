const mysql = require('mysql2/promise');

// Verbindung zur MySQL-Datenbank
const pool = mysql.createPool({
    host: '172.20.0.10',
    user: 'root',
    password: 'wadÖIZtwüa0e8rbz0Üabw08Zabwe+aw8b',
    database: 'Lab2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;

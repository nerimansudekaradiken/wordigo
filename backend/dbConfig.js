const sql = require('mssql');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const poolPromise = new sql.ConnectionPool(DB_CONFIG)
    .connect()
    .then(pool => {
        console.log('✅ Veritabanı bağlantısı başarılı.');
        return pool;
    })
    .catch(err => {
        console.error('❌ Veritabanı bağlantı hatası:', err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };
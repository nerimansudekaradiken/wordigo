const sql = require('mssql'); // <-- msnodesqlv8 eklentisini sildik!
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ MSSQL Veritabanına sa Kullanıcısı ile Başarıyla Bağlanıldı!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Bağlantı Hatası: ', err);
    });

module.exports = { sql, poolPromise };
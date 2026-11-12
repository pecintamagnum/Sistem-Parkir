require('dotenv').config();
const mysql = require('mysql2/promise');

// Buat connection pool untuk performa query yang efisien & tangguh
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_parkir',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Helper testing koneksi awal
pool.getConnection()
  .then((conn) => {
    console.log(`[DATABASE] Berhasil terhubung ke database '${process.env.DB_NAME || 'db_parkir'}' di MySQL!`);
    conn.release();
  })
  .catch((err) => {
    console.error(`[DATABASE ERROR] Gagal koneksi ke database:`, err.message);
    console.error(`Pastikan Laragon/XAMPP sudah START dan database 'db_parkir' sudah dibuat.`);
  });

module.exports = pool;

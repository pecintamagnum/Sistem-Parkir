require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const port = process.env.DB_PORT || 3306;
  const database = process.env.DB_NAME || 'db_parkir';

  console.log(`[SEED] Menghubungkan ke MySQL di ${host}:${port}...`);

  try {
    // 1. Koneksi awal tanpa memilih database untuk memastikan database ada
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true,
    });

    console.log(`[SEED] Terhubung! Membaca file database.sql...`);
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log(`[SEED] Mengeksekusi query database.sql...`);
    await connection.query(sqlContent);

    console.log(`[SUCCESS] Database '${database}' berhasil di-inisialisasi dan data awal telah di-seed!`);
    console.log(`------------------------------------------------------`);
    console.log(`Akun Default Siap Digunakan:`);
    console.log(`1. Admin   : username = admin   | password = admin123`);
    console.log(`2. Petugas : username = petugas | password = petugas123`);
    console.log(`3. Owner   : username = owner   | password = owner123`);
    console.log(`------------------------------------------------------`);

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error(`[ERROR] Gagal inisialisasi database:`, err.message);
    console.log(`\nTips:`);
    console.log(`1. Pastikan MySQL di Laragon / XAMPP sudah berjalan (Start All).`);
    console.log(`2. Periksa kecocokan password DB_PASS di file backend/.env.`);
    process.exit(1);
  }
}

seedDatabase();

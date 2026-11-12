# 🚗 Backend Sistem Parkir - UKK RPL Paket 2

Aplikasi Backend RESTful API untuk Sistem Parkir Berbasis Petugas (Manual Gate Operator) sesuai Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak 2025/2026 Paket 2.

## 🚀 Fitur Utama

- **3 Level Pengguna (Role-Based Access Control)**:
  - **Admin**: CRUD User, CRUD Tarif Parkir, CRUD Area Parkir, CRUD Kendaraan, Akses Log Aktivitas, Dashboard Statistik.
  - **Petugas**: Loket Parkir Masuk (Input Plat, Cek Kapasitas, Cetak Karcis), Loket Parkir Keluar (Kalkulasi Biaya Otomatis, Input Pembayaran & Kembalian, Cetak Struk).
  - **Owner**: Dashboard Eksekutif & Rekap Laporan Transaksi Berdasarkan Filter Tanggal / Rentang Waktu (Bisa Export / Print).
- **Keamanan**: Password di-hash menggunakan `bcryptjs`, Autentikasi Stateless dengan `JSON Web Token (JWT)`.
- **Integritas Bisnis**: Pengecekan real-time sisa slot parkir, pencegahan duplikasi kendaraan di dalam area, kalkulasi durasi otomatis (pembulatan jam ke atas).

---

## 🛠️ Panduan Instalasi & Menjalankan

### 1. Prasyarat
- Node.js (v18+)
- MySQL Server (Laragon / XAMPP)

### 2. Konfigurasi Database (.env)
Buka file `.env` di folder `backend/`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=db_parkir
DB_PORT=3306
JWT_SECRET=rahasia_super_aman_sistem_parkir_ukk_2026
```

### 3. Migrasi & Seeding Database
Nyalakan MySQL di Laragon / XAMPP (klik **Start All**), kemudian jalankan:
```bash
npm run seed
```
Perintah ini akan membuat database `db_parkir`, semua tabel skema UKK, dan mengisi akun default serta tarif awal.

### 4. Menjalankan Server
Mode pengembangan (auto-reload):
```bash
npm run dev
```
Mode produksi:
```bash
npm start
```

Server akan aktif di: `http://localhost:5000/api`

---

## 👤 Akun Bawaan (Default Credentials)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Petugas | `petugas` | `petugas123` |
| Owner | `owner` | `owner123` |

---

## 📖 Dokumentasi Endpoint API
Silakan baca file lengkap [API_DOCUMENTATION.md](file:///c:/sistem_parkir/backend/API_DOCUMENTATION.md) untuk kontrak request/response JSON yang siap diberikan ke teman Frontend.

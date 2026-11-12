# 📘 API Documentation - Sistem Parkir (Manual Operator)
> **Spesifikasi Proyek**: UKK RPL 2025/2026 - Paket 2  
> **Arsitektur**: Express.js + MySQL (MVC)  
> **Base URL**: `http://localhost:5000/api`  
> **Auth Header**: `Authorization: Bearer <token_jwt>` (wajib untuk endpoint terproteksi)

---

## 📋 Daftar Akun Default (Hasil Seed Database)

| Role | Username | Password | Deskripsi Tugas |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Kelola master data (User, Tarif, Area, Kendaraan) & Lihat Log |
| **Petugas** | `petugas` | `petugas123` | Layani Parkir Masuk, Parkir Keluar, & Cetak Karcis/Struk |
| **Owner** | `owner` | `owner123` | Lihat Dashboard & Rekap Laporan Transaksi |

---

## 🚦 Alur Swimlane (Manual Petugas Loket)

```
[Pengendara Masuk] 
       ⬇
[Petugas Loket Masuk] ➡️ Input Plat, Jenis, Area di form 'Parkir Masuk'
       ⬇
[Sistem] ➡️ Cek Kapasitas Area & Tarif -> Simpan Transaksi Masuk -> Sisa Slot -1
       ⬇
[Petugas Loket Masuk] ➡️ Cetak Karcis Masuk (Browser/Thermal) -> Serahkan ke Pengendara
       ⬇
[Pengendara Parkir]
       ⬇
[Pengendara Keluar] ➡️ Menyerahkan Karcis / Sebut Plat ke Petugas Loket Keluar
       ⬇
[Petugas Loket Keluar] ➡️ Cari Karcis/Plat di sistem (Endpoint: GET /api/transaksi/cek-keluar)
       ⬇
[Sistem] ➡️ Hitung Durasi Jam & Total Biaya (Durasi * Tarif/Jam)
       ⬇
[Petugas Loket Keluar] ➡️ Terima Uang -> Input Nominal Bayar -> Klik 'Bayar & Selesai'
       ⬇
[Sistem] ➡️ Simpan Transaksi Keluar, Kembalian, Slot Parkir +1, Catat Log
       ⬇
[Petugas Loket Keluar] ➡️ Cetak Struk Keluar -> Berikan Struk & Kembalian ke Pengendara
```

---

## 🔐 1. Modul Autentikasi (`/auth`)

### 1.1 Login Pengguna
- **URL**: `POST /api/auth/login`
- **Akses**: Public (Semua Role)
- **Request Body**:
```json
{
  "username": "petugas",
  "password": "petugas123"
}
```
- **Response Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id_user": 2,
      "nama_lengkap": "Petugas Loket Gerbang",
      "username": "petugas",
      "role": "petugas"
    }
  }
}
```

### 1.2 Get Profil User Login
- **URL**: `GET /api/auth/me`
- **Akses**: Butuh Token

### 1.3 Logout
- **URL**: `POST /api/auth/logout`
- **Akses**: Butuh Token

---

## 🚗 2. Modul Core Bisnis - Transaksi Parkir (`/transaksi`)

### 2.1 Catat Parkir Masuk (Loket Masuk)
- **URL**: `POST /api/transaksi/masuk`
- **Akses**: Petugas, Admin
- **Request Body**:
```json
{
  "plat_nomor": "B 9988 XYZ",
  "jenis_kendaraan": "motor",
  "warna": "Merah",
  "pemilik": "Ahmad",
  "id_area": 1
}
```
- **Response Sukses (201 Created)**:
```json
{
  "success": true,
  "message": "Parkir masuk berhasil dicatat. Silakan cetak karcis.",
  "data": {
    "transaksi": {
      "id_parkir": 10,
      "kode_karcis": "PKR-20261112-4821",
      "waktu_masuk": "2026-11-12T10:30:00.000Z",
      "status": "masuk",
      "plat_nomor": "B 9988 XYZ",
      "jenis_kendaraan": "motor",
      "warna": "Merah",
      "pemilik": "Ahmad",
      "nama_area": "Area A (Motor)",
      "tarif_per_jam": "2000",
      "nama_petugas": "Petugas Loket Gerbang"
    },
    "karcis_masuk": {
      "kode_karcis": "PKR-20261112-4821",
      "plat_nomor": "B 9988 XYZ",
      "jenis_kendaraan": "motor",
      "waktu_masuk": "2026-11-12T10:30:00.000Z",
      "nama_area": "Area A (Motor)",
      "tarif_per_jam": "2000",
      "petugas": "Petugas Loket Gerbang"
    }
  }
}
```

---

### 2.2 Cek / Preview Parkir Keluar (Kalkulasi Biaya Real-time)
- **URL**: `GET /api/transaksi/cek-keluar?search=B 9988 XYZ` *(bisa juga pakai `search=PKR-20261112-4821`)*
- **Akses**: Petugas, Admin
- **Response Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Kalkulasi parkir keluar berhasil.",
  "data": {
    "id_parkir": 10,
    "kode_karcis": "PKR-20261112-4821",
    "plat_nomor": "B 9988 XYZ",
    "jenis_kendaraan": "motor",
    "warna": "Merah",
    "pemilik": "Ahmad",
    "nama_area": "Area A (Motor)",
    "waktu_masuk": "2026-11-12T08:00:00.000Z",
    "waktu_keluar_estimasi": "2026-11-12T10:30:00.000Z",
    "durasi_jam": 3,
    "tarif_per_jam": 2000,
    "total_biaya": 6000
  }
}
```

---

### 2.3 Bayar & Selesaikan Parkir Keluar (Loket Keluar)
- **URL**: `POST /api/transaksi/keluar`
- **Akses**: Petugas, Admin
- **Request Body**:
```json
{
  "id_parkir": 10,
  "jumlah_bayar": 10000
}
```
- **Response Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Pembayaran berhasil. Kendaraan diizinkan keluar.",
  "data": {
    "struk_keluar": {
      "kode_karcis": "PKR-20261112-4821",
      "plat_nomor": "B 9988 XYZ",
      "jenis_kendaraan": "motor",
      "nama_area": "Area A (Motor)",
      "waktu_masuk": "2026-11-12T08:00:00.000Z",
      "waktu_keluar": "2026-11-12T10:30:00.000Z",
      "durasi_jam": 3,
      "tarif_per_jam": "2000",
      "biaya_total": "6000",
      "jumlah_bayar": 10000,
      "kembalian": 4000,
      "petugas": "Petugas Loket Gerbang"
    }
  }
}
```

---

### 2.4 Daftar Kendaraan Sedang Parkir Aktif
- **URL**: `GET /api/transaksi/aktif?search=&id_area=&page=1&limit=10`
- **Akses**: Petugas, Admin, Owner

### 2.5 Detail Transaksi & Cetak Ulang
- **URL**: `GET /api/transaksi/:id` *(bisa ID angka atau Kode Karcis)*
- **Akses**: Petugas, Admin, Owner

---

## 📊 3. Modul Laporan & Dashboard (`/reports`)

### 3.1 Rekap Laporan Transaksi Sesuai Waktu yang Diminta (Fitur Utama Owner)
- **URL**: `GET /api/reports/transaksi?startDate=2026-11-01&endDate=2026-11-12&jenis=&id_area=&status=`
- **Akses**: Owner, Admin
- **Response Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Rekap laporan transaksi berhasil diambil.",
  "data": {
    "summary": {
      "total_transaksi": 45,
      "total_aktif_masuk": 12,
      "total_sudah_keluar": 33,
      "total_pendapatan": 250000,
      "total_durasi_jam": 88,
      "rata_rata_durasi_jam": 2.7
    },
    "transaksi": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 3.2 Dashboard Overview (Statistik Real-time)
- **URL**: `GET /api/reports/dashboard`
- **Akses**: Admin, Petugas, Owner

---

## 🛠️ 4. Modul Master Data (Admin)

### 4.1 Master User (`/users`)
- `GET /api/users` - List user (pagination & search)
- `GET /api/users/:id` - Detail user
- `POST /api/users` - Tambah user (`nama_lengkap`, `username`, `password`, `role: 'admin'|'petugas'|'owner'`)
- `PUT /api/users/:id` - Edit user
- `DELETE /api/users/:id` - Hapus user

### 4.2 Master Tarif (`/tarif`)
- `GET /api/tarif` - List tarif semua jenis kendaraan
- `POST /api/tarif` - Tambah tarif
- `PUT /api/tarif/:id` - Edit tarif per jam
- `DELETE /api/tarif/:id` - Hapus tarif

### 4.3 Master Area Parkir (`/area`)
- `GET /api/area` - List area, kapasitas, terisi, sisa slot, persentase terisi
- `POST /api/area` - Tambah area
- `PUT /api/area/:id` - Edit area & kapasitas
- `DELETE /api/area/:id` - Hapus area

### 4.4 Master Kendaraan (`/kendaraan`)
- `GET /api/kendaraan` - List kendaraan
- `GET /api/kendaraan/:idOrPlat` - Cari kendaraan berdasarkan ID atau plat nomor
- `POST /api/kendaraan` - Tambah kendaraan
- `PUT /api/kendaraan/:id` - Edit kendaraan
- `DELETE /api/kendaraan/:id` - Hapus kendaraan (Admin only)

### 4.5 Log Aktivitas (`/logs`)
- `GET /api/logs?search=&startDate=&endDate=&page=1&limit=15` - Akses riwayat aktivitas user

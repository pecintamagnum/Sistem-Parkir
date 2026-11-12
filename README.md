# 🚗 Sistem Parkir 

Aplikasi Sistem Informasi Parkir Berbasis Petugas (Manual Gate Operator) untuk Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak 2025/2026 Paket 2.

## 👥 Anggota Tim
- **Backend Developer**: Menangani RESTful API, Database MySQL, Autentikasi JWT, Logika Bisnis & Laporan.
- **Frontend Developer**: Menangani Antarmuka Pengguna (UI/UX), Integrasi API, Cetak Karcis/Struk, & Dashboard.

---

## 📁 Struktur Repositori

```
sistem_parkir/
├── backend/                  # Kode Backend Express.js + MySQL (MVC)
│   ├── config/              # Koneksi Database
│   ├── database/            # Skrip DDL & Seeder Database
│   ├── controllers/         # Kontroler Logika Bisnis
│   ├── middlewares/         # Autentikasi JWT & Role Authorization
│   ├── routes/              # Rute Endpoint API
│   ├── utils/               # Helper Respon & Logging
│   ├── API_DOCUMENTATION.md # Dokumentasi Kontrak API untuk Frontend
│   └── server.js            # Entry Point Server
└── frontend/                 # Workspace Aplikasi Frontend (Teman Tim)
```

---

## 🚦 Alur Sistem (Manual Operator)
- **Gerbang Masuk**: Petugas loket menginput plat nomor & jenis kendaraan $\rightarrow$ Sistem memeriksa ketersediaan slot parkir $\rightarrow$ Transaksi masuk dicatat $\rightarrow$ Karcis masuk dicetak untuk pengendara.
- **Gerbang Keluar**: Pengendara menyerahkan karcis/sebut plat $\rightarrow$ Petugas memeriksa karcis di sistem $\rightarrow$ Sistem menghitung otomatis durasi parkir & total tagihan sesuai tarif $\rightarrow$ Petugas menerima pembayaran $\rightarrow$ Struk pembayaran keluar dicetak $\rightarrow$ Kapasitas slot bertambah.

---

## 🚀 Panduan Memulai Backend

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Salin environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependensi:
   ```bash
   npm install
   ```
4. Pastikan MySQL sudah aktif (Laragon/XAMPP), lalu inisialisasi database:
   ```bash
   npm run seed
   ```
5. Jalankan server:
   ```bash
   npm run dev
   ```
   Server aktif di `http://localhost:5000/api`.

---

## 📘 Dokumentasi API
Detail endpoint, request body, dan format response dapat dilihat di:
👉 [**backend/API_DOCUMENTATION.md**](backend/API_DOCUMENTATION.md)

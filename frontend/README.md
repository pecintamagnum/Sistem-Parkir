# 🚗 Frontend Sistem Informasi Parkir (UKK RPL Paket 2)
> **Aplikasi Berbasis Operator Petugas Loket Manual (Manual Gate Operator)**  
> Sesuai Standar Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak Tahun Ajaran 2025/2026 - Paket 2.

---

## 👥 Profil Tim Proyek
- **Frontend Developer** *(Anda)*: Antarmuka Pengguna (UI/UX), Client-Side Router SPA, Integrasi RESTful API, Simulasi & Cetak Karcis/Struk Thermal, Validasi Input, serta Laporan Owner.
- **Backend Developer** *(Rekan Tim)*: RESTful API Express.js, Database MySQL `db_parkir`, JWT Authentication, Skema Relasi Tabel, Middleware Logging & Authorization.

---

## 🚦 Alur Sistem Manual Operator (Sesuai Swimlane Diagram)

```
[Pengendara Masuk]
       ⬇
[Petugas Loket Masuk] ➡️ Memasukkan Plat Nomor, Jenis Kendaraan, dan Memilih Area
       ⬇
[Sistem Parkir]      ➡️ Validasi Kapasitas Slot Area & Hitung Tarif -> Catat Transaksi Masuk -> Slot -1
       ⬇
[Petugas Loket Masuk] ➡️ Cetak Karcis Masuk (Barcode / Thermal) -> Serahkan Karcis ke Pengendara
       ⬇
[Pengendara Parkir]  ➡️ Kendaraan parkir di dalam area
       ⬇
[Pengendara Keluar] ➡️ Menyerahkan Karcis Masuk / Sebutkan Nomor Plat
       ⬇
[Petugas Loket Keluar] ➡️ Input Plat / Scan Kode Karcis di Sistem
       ⬇
[Sistem Parkir]      ➡️ Hitung Otomatis Durasi Jam (Ceil/Pembulatan Ke Atas) & Total Biaya (Durasi * Tarif/Jam)
       ⬇
[Petugas Loket Keluar] ➡️ Menerima Uang Tunai -> Input Uang Diterima -> Sistem Hitung Kembalian
       ⬇
[Petugas Loket Keluar] ➡️ Klik 'Selesaikan Pembayaran' -> Cetak Struk Pembayaran Keluar -> Slot +1
       ⬇
[Pengendara Keluar] ➡️ Menerima Struk & Uang Kembalian -> Palang Terbuka / Keluar Area
```

---

## 🗓️ Kesesuaian Jadwal & Timeline (Sprint 1 - 4)

| Sprint | Modul & Tugas | Implementasi di Frontend | Status |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | **Setup & Autentikasi** | • Router JavaScript Single-Page Application (SPA) Hash-based.<br>• Form Login modern dengan shortcut role testing 1-klik (`admin`, `petugas`, `owner`).<br>• Manajemen State Auth (Token JWT, Session LocalStorage & Route Guards).<br>• Layout Master Shell dengan Sidebar dinamis sesuai hak akses role & live clock WIB. | ✅ Selesai |
| **Sprint 2** | **Master Data Management (CRUD)** | • **Manajemen User (Admin)**: Tabel, Search, Filter Role, Modal Tambah/Edit, Status Aktif/Nonaktif, Hapus.<br>• **Manajemen Tarif & Area**: Pengaturan biaya per jam & kapasitas slot parkir.<br>• **Database Kendaraan**: Pencatatan master plat & pemilik kendaraan.<br>• **Akses Log Aktivitas**: Audit trail riwayat aksi user & filter rentang tanggal. | ✅ Selesai |
| **Sprint 3** | **Core Business Logic (Transaksi & Struk)** | • **Loket Parkir Masuk**: Form input plat nomor auto-uppercase, visual selector jenis (motor, mobil, truk), live capacity monitoring bar per area.<br>• **Modal Cetak Karcis Masuk**: Format kertas thermal 58mm/80mm lengkap dengan SVG Barcode, waktu masuk, dan instruksi.<br>• **Loket Parkir Keluar**: Real-time lookup plat/karcis, kalkulator durasi & total biaya otomatis, kalkulator uang kembalian dan preset uang tunai.<br>• **Modal Cetak Struk Keluar**: Layout struk pembayaran resmi siap cetak (Browser Print). | ✅ Selesai |
| **Sprint 4** | **Reporting, Testing & Polish** | • **Dashboard Owner**: Widget total pendapatan, total transaksi, rata-rata durasi.<br>• **Rekap Transaksi Sesuai Waktu yang Diminta**: Filter tanggal awal s/d akhir, jenis kendaraan, dan status.<br>• **Fitur Cetak Laporan Resmi**: Format kop surat resmi untuk pimpinan dengan tanda tangan.<br>• **Fitur Export CSV / Excel**: Unduh langsung file data spreadsheet `.csv`.<br>• **Backend Status Pill & Mode Simulasi (Offline Fallback)**: Aplikasi tetap dapat didemokan secara penuh sekalipun server backend/MySQL belum dihidupkan. | ✅ Selesai |

---

## 🚀 Panduan Menjalankan Frontend

Aplikasi frontend ini dirancang **fleksibel** dan dapat dijalankan dengan berbagai cara sesuai fasilitas komputer lab:

### Cara 1: Menggunakan Script Server Bawaan (Paling Cepat & Tanpa Install Dependensi)
Cukup pastikan Node.js terpasang, lalu jalankan:
```bash
cd frontend
node serve.js
```
Buka browser di: **`http://localhost:3000`**

### Cara 2: Menggunakan Vite Development Server
```bash
cd frontend
npm install
npm run dev
```
Buka browser di: **`http://localhost:5173`**

### Cara 3: Menggunakan VS Code Live Server
1. Buka folder `c:\Sistem-Parkir-main` di VS Code.
2. Klik kanan file `frontend/index.html` $\rightarrow$ pilih **"Open with Live Server"**.

---

## 🔑 Akun Default untuk Pengujian Penguji (UKK)

Di halaman login, tersedia tombol pintas (**Quick Role Switcher**) sehingga penguji atau guru dapat langsung menguji akun tanpa perlu mengetik manual:

| Role | Username | Password | Akses Halaman |
| :--- | :--- | :--- | :--- |
| **Petugas** | `petugas` | `petugas123` | Loket Masuk, Loket Keluar, Monitoring Kendaraan Aktif, Cetak Karcis & Struk |
| **Admin** | `admin` | `admin123` | Dashboard Admin, Master User, Tarif, Area Parkir, Kendaraan, Log Aktivitas |
| **Owner** | `owner` | `owner123` | Dashboard Keuangan, Rekap Laporan Transaksi (Filter Waktu, Cetak Resmi & CSV) |

---

## 💡 Fitur Keunggulan Khusus untuk Nilai Plus UKK

1. **Dual Mode (Live Backend API + Offline Simulation Fallback)**:
   - Terhubung secara default ke REST API Express.js di `http://localhost:5000/api`.
   - Jika MySQL atau backend belum dinyalakan, sistem secara cerdas beralih ke **Mode Simulasi** (Mock Data) sehingga Anda **tidak akan pernah gagal presentasi di hadapan penguji**.
   - Indikator status dapat dilihat pada pill di pojok kanan atas topbar.
2. **Thermal Receipt Printing Engine**:
   - Cetak karcis masuk dan struk pembayaran dengan format standar mesin kasir thermal (58mm/80mm) yang rapi saat ditekan `Ctrl+P` atau tombol Cetak.
3. **Official Report Printout**:
   - Halaman Laporan Owner memiliki format cetak surat resmi lengkap dengan Kop Surat Lembaga, tabel transaksi rapi, dan kolom tanda tangan Pimpinan.
4. **Real-time Change & Cash Calculation**:
   - Menghindari kesalahan hitung manual kasir dengan tombol uang pas dan nominal kelipatan rupiah.


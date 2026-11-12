// Mock Data untuk Pengujian Offline / Mode Simulasi UKK
export const mockData = {
  users: [
    { id_user: 1, nama_lengkap: 'Administrator Utama', username: 'admin', role: 'admin', status_aktif: 1 },
    { id_user: 2, nama_lengkap: 'Petugas Loket Gerbang', username: 'petugas', role: 'petugas', status_aktif: 1 },
    { id_user: 3, nama_lengkap: 'Owner / Pimpinan', username: 'owner', role: 'owner', status_aktif: 1 }
  ],
  tarif: [
    { id_tarif: 1, jenis_kendaraan: 'motor', tarif_per_jam: '2000' },
    { id_tarif: 2, jenis_kendaraan: 'mobil', tarif_per_jam: '5000' },
    { id_tarif: 3, jenis_kendaraan: 'lainnya', tarif_per_jam: '10000' }
  ],
  area: [
    { id_area: 1, nama_area: 'Area A (Motor)', kapasitas: 50, terisi: 18, sisa_slot: 32, persentase_terisi: 36.0 },
    { id_area: 2, nama_area: 'Area B (Mobil)', kapasitas: 30, terisi: 12, sisa_slot: 18, persentase_terisi: 40.0 },
    { id_area: 3, nama_area: 'Area C (VIP / Lainnya)', kapasitas: 10, terisi: 3, sisa_slot: 7, persentase_terisi: 30.0 }
  ],
  kendaraan: [
    { id_kendaraan: 1, plat_nomor: 'B 1234 ABC', jenis_kendaraan: 'motor', warna: 'Hitam', pemilik: 'Budi Santoso' },
    { id_kendaraan: 2, plat_nomor: 'B 5678 DEF', jenis_kendaraan: 'mobil', warna: 'Putih', pemilik: 'Siti Aminah' },
    { id_kendaraan: 3, plat_nomor: 'D 9988 XYZ', jenis_kendaraan: 'motor', warna: 'Merah', pemilik: 'Rudi Hartono' },
    { id_kendaraan: 4, plat_nomor: 'B 8888 BOS', jenis_kendaraan: 'mobil', warna: 'Hitam', pemilik: 'Hendra Gunawan' },
    { id_kendaraan: 5, plat_nomor: 'B 4321 TRK', jenis_kendaraan: 'lainnya', warna: 'Kuning', pemilik: 'PT Angkut Jaya' }
  ],
  transaksi: [
    {
      id_parkir: 1,
      kode_karcis: 'PKR-20261112-1001',
      id_kendaraan: 1,
      plat_nomor: 'B 1234 ABC',
      jenis_kendaraan: 'motor',
      warna: 'Hitam',
      pemilik: 'Budi Santoso',
      id_area: 1,
      nama_area: 'Area A (Motor)',
      waktu_masuk: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      waktu_keluar: null,
      id_tarif: 1,
      tarif_per_jam: '2000',
      durasi_jam: null,
      biaya_total: null,
      status: 'masuk',
      nama_petugas: 'Petugas Loket Gerbang'
    },
    {
      id_parkir: 2,
      kode_karcis: 'PKR-20261112-1002',
      id_kendaraan: 2,
      plat_nomor: 'B 5678 DEF',
      jenis_kendaraan: 'mobil',
      warna: 'Putih',
      pemilik: 'Siti Aminah',
      id_area: 2,
      nama_area: 'Area B (Mobil)',
      waktu_masuk: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      waktu_keluar: null,
      id_tarif: 2,
      tarif_per_jam: '5000',
      durasi_jam: null,
      biaya_total: null,
      status: 'masuk',
      nama_petugas: 'Petugas Loket Gerbang'
    },
    {
      id_parkir: 3,
      kode_karcis: 'PKR-20261112-0901',
      id_kendaraan: 3,
      plat_nomor: 'D 9988 XYZ',
      jenis_kendaraan: 'motor',
      warna: 'Merah',
      pemilik: 'Rudi Hartono',
      id_area: 1,
      nama_area: 'Area A (Motor)',
      waktu_masuk: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      waktu_keluar: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      id_tarif: 1,
      tarif_per_jam: '2000',
      durasi_jam: 4,
      biaya_total: '8000',
      status: 'keluar',
      nama_petugas: 'Petugas Loket Gerbang'
    }
  ],
  logs: [
    { id_log: 1, username: 'admin', role: 'admin', aktivitas: "Admin berhasil login ke sistem", waktu_aktivitas: new Date(Date.now() - 3600 * 1000).toISOString() },
    { id_log: 2, username: 'petugas', role: 'petugas', aktivitas: "Petugas mencatat parkir masuk: B 1234 ABC - Karcis: PKR-20261112-1001", waktu_aktivitas: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    { id_log: 3, username: 'petugas', role: 'petugas', aktivitas: "Petugas memproses keluar: D 9988 XYZ - Total: Rp 8.000", waktu_aktivitas: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
  ]
};


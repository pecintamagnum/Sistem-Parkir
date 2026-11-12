const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(verifyToken);

// 1. Catat Parkir Masuk (Petugas & Admin)
router.post('/masuk', authorizeRoles('petugas', 'admin'), transaksiController.parkirMasuk);

// 2. Cek & Preview Parkir Keluar (Kalkulasi biaya otomatis)
router.get('/cek-keluar', authorizeRoles('petugas', 'admin'), transaksiController.cekParkirKeluar);

// 3. Bayar & Selesaikan Parkir Keluar (Petugas & Admin)
router.post('/keluar', authorizeRoles('petugas', 'admin'), transaksiController.bayarParkirKeluar);

// 4. Daftar Kendaraan Sedang Parkir Aktif
router.get('/aktif', authorizeRoles('petugas', 'admin', 'owner'), transaksiController.getActiveParkir);

// 5. Detail Transaksi (Untuk cetak karcis / struk)
router.get('/:id', authorizeRoles('petugas', 'admin', 'owner'), transaksiController.getDetailTransaksi);

module.exports = router;

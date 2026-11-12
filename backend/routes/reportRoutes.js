const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(verifyToken);

// Rekap Laporan Transaksi (Fitur Utama Owner & Admin)
router.get('/transaksi', authorizeRoles('owner', 'admin'), reportController.getRekapTransaksi);

// Dashboard Overview (Statistik ringkas)
router.get('/dashboard', authorizeRoles('owner', 'admin', 'petugas'), reportController.getDashboardOverview);

module.exports = router;

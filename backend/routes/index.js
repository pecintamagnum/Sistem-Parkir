const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const tarifRoutes = require('./tarifRoutes');
const areaRoutes = require('./areaRoutes');
const kendaraanRoutes = require('./kendaraanRoutes');
const transaksiRoutes = require('./transaksiRoutes');
const logRoutes = require('./logRoutes');
const reportRoutes = require('./reportRoutes');

// Root API Check
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Sistem Parkir API (UKK RPL 2025/2026)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Daftarkan Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tarif', tarifRoutes);
router.use('/area', areaRoutes);
router.use('/kendaraan', kendaraanRoutes);
router.use('/transaksi', transaksiRoutes);
router.use('/logs', logRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

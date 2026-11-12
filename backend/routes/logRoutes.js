const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Akses Log Aktivitas hanya untuk Admin (sesuai matriks fitur UKK)
router.get('/', verifyToken, authorizeRoles('admin'), logController.getLogs);

module.exports = router;

const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Membaca data area parkir (termasuk cek sisa slot) bisa diakses semua role yang login
router.get('/', verifyToken, areaController.getAllArea);
router.get('/:id', verifyToken, areaController.getAreaById);

// Create, Update, Delete area parkir HANYA oleh Admin
router.post('/', verifyToken, authorizeRoles('admin'), areaController.createArea);
router.put('/:id', verifyToken, authorizeRoles('admin'), areaController.updateArea);
router.delete('/:id', verifyToken, authorizeRoles('admin'), areaController.deleteArea);

module.exports = router;

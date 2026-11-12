const express = require('express');
const router = express.Router();
const tarifController = require('../controllers/tarifController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Membaca tarif bisa dilakukan oleh admin, petugas, dan owner
router.get('/', verifyToken, tarifController.getAllTarif);
router.get('/:id', verifyToken, tarifController.getTarifById);

// Create, Update, Delete tarif HANYA boleh oleh Admin
router.post('/', verifyToken, authorizeRoles('admin'), tarifController.createTarif);
router.put('/:id', verifyToken, authorizeRoles('admin'), tarifController.updateTarif);
router.delete('/:id', verifyToken, authorizeRoles('admin'), tarifController.deleteTarif);

module.exports = router;

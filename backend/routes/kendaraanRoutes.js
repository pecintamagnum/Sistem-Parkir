const express = require('express');
const router = express.Router();
const kendaraanController = require('../controllers/kendaraanController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(verifyToken);

// Read
router.get('/', authorizeRoles('admin', 'petugas', 'owner'), kendaraanController.getAllKendaraan);
router.get('/:idOrPlat', authorizeRoles('admin', 'petugas', 'owner'), kendaraanController.getKendaraanByIdOrPlat);

// Create & Update (Admin & Petugas)
router.post('/', authorizeRoles('admin', 'petugas'), kendaraanController.createKendaraan);
router.put('/:id', authorizeRoles('admin', 'petugas'), kendaraanController.updateKendaraan);

// Delete (HANYA Admin)
router.delete('/:id', authorizeRoles('admin'), kendaraanController.deleteKendaraan);

module.exports = router;

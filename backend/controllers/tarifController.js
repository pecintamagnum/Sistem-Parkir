const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAktivitas } = require('../utils/loggerHelper');

/**
 * Get All Tarif Parkir
 * GET /api/tarif
 */
const getAllTarif = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_tarif, jenis_kendaraan, tarif_per_jam FROM tb_tarif ORDER BY id_tarif ASC');
    return sendSuccess(res, 'Data tarif parkir berhasil diambil.', rows);
  } catch (err) {
    return sendError(res, 'Gagal mengambil data tarif parkir.', err);
  }
};

/**
 * Get Tarif By ID
 * GET /api/tarif/:id
 */
const getTarifById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id_tarif, jenis_kendaraan, tarif_per_jam FROM tb_tarif WHERE id_tarif = ?', [id]);

    if (rows.length === 0) {
      return sendError(res, 'Data tarif tidak ditemukan.', null, 404);
    }

    return sendSuccess(res, 'Detail tarif berhasil diambil.', rows[0]);
  } catch (err) {
    return sendError(res, 'Gagal mengambil detail tarif.', err);
  }
};

/**
 * Create Tarif (Admin)
 * POST /api/tarif
 */
const createTarif = async (req, res) => {
  try {
    const { jenis_kendaraan, tarif_per_jam } = req.body;

    if (!jenis_kendaraan || tarif_per_jam === undefined) {
      return sendError(res, 'Jenis kendaraan dan tarif_per_jam wajib diisi.', null, 400);
    }

    if (!['motor', 'mobil', 'lainnya'].includes(jenis_kendaraan)) {
      return sendError(res, "Jenis kendaraan harus salah satu dari: 'motor', 'mobil', atau 'lainnya'.", null, 400);
    }

    const [exists] = await db.query('SELECT id_tarif FROM tb_tarif WHERE jenis_kendaraan = ?', [jenis_kendaraan]);
    if (exists.length > 0) {
      return sendError(res, `Tarif untuk jenis '${jenis_kendaraan}' sudah ada. Silakan gunakan fitur edit.`, null, 409);
    }

    const [result] = await db.query(
      'INSERT INTO tb_tarif (jenis_kendaraan, tarif_per_jam) VALUES (?, ?)',
      [jenis_kendaraan, parseFloat(tarif_per_jam)]
    );

    await logAktivitas(req.user.id_user, `Admin membuat tarif baru: ${jenis_kendaraan} = Rp ${tarif_per_jam}/jam`);

    return sendSuccess(res, 'Tarif parkir berhasil ditambahkan.', {
      id_tarif: result.insertId,
      jenis_kendaraan,
      tarif_per_jam: parseFloat(tarif_per_jam)
    }, 201);
  } catch (err) {
    return sendError(res, 'Gagal menambahkan tarif.', err);
  }
};

/**
 * Update Tarif (Admin)
 * PUT /api/tarif/:id
 */
const updateTarif = async (req, res) => {
  try {
    const { id } = req.params;
    const { jenis_kendaraan, tarif_per_jam } = req.body;

    const [existing] = await db.query('SELECT * FROM tb_tarif WHERE id_tarif = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'Tarif tidak ditemukan.', null, 404);
    }

    const updatedJenis = jenis_kendaraan || existing[0].jenis_kendaraan;
    const updatedTarif = tarif_per_jam !== undefined ? parseFloat(tarif_per_jam) : existing[0].tarif_per_jam;

    await db.query(
      'UPDATE tb_tarif SET jenis_kendaraan = ?, tarif_per_jam = ? WHERE id_tarif = ?',
      [updatedJenis, updatedTarif, id]
    );

    await logAktivitas(req.user.id_user, `Admin memperbarui tarif ${updatedJenis} menjadi Rp ${updatedTarif}/jam`);

    return sendSuccess(res, 'Tarif parkir berhasil diperbarui.', {
      id_tarif: parseInt(id, 10),
      jenis_kendaraan: updatedJenis,
      tarif_per_jam: updatedTarif
    });
  } catch (err) {
    return sendError(res, 'Gagal memperbarui tarif.', err);
  }
};

/**
 * Delete Tarif (Admin)
 * DELETE /api/tarif/:id
 */
const deleteTarif = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM tb_tarif WHERE id_tarif = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'Tarif tidak ditemukan.', null, 404);
    }

    await db.query('DELETE FROM tb_tarif WHERE id_tarif = ?', [id]);
    await logAktivitas(req.user.id_user, `Admin menghapus tarif ID ${id} (${existing[0].jenis_kendaraan})`);

    return sendSuccess(res, 'Tarif parkir berhasil dihapus.');
  } catch (err) {
    return sendError(res, 'Gagal menghapus tarif. Pastikan data tidak terikat ke transaksi.', err);
  }
};

module.exports = {
  getAllTarif,
  getTarifById,
  createTarif,
  updateTarif,
  deleteTarif
};

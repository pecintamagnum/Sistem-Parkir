const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAktivitas } = require('../utils/loggerHelper');

/**
 * Get All Area Parkir (Real-time kapasitas, terisi, dan sisa slot)
 * GET /api/area
 */
const getAllArea = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id_area,
        nama_area,
        kapasitas,
        terisi,
        (kapasitas - terisi) AS sisa_slot,
        ROUND((terisi / kapasitas) * 100, 1) AS persentase_terisi,
        CASE 
          WHEN terisi >= kapasitas THEN 'Penuh'
          WHEN (terisi / kapasitas) >= 0.8 THEN 'Hampir Penuh'
          ELSE 'Tersedia'
        END AS status_ketersediaan
      FROM tb_area_parkir
      ORDER BY id_area ASC
    `);

    return sendSuccess(res, 'Data area parkir berhasil diambil.', rows);
  } catch (err) {
    return sendError(res, 'Gagal mengambil data area parkir.', err);
  }
};

/**
 * Get Area By ID
 * GET /api/area/:id
 */
const getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        id_area,
        nama_area,
        kapasitas,
        terisi,
        (kapasitas - terisi) AS sisa_slot
      FROM tb_area_parkir 
      WHERE id_area = ?
    `, [id]);

    if (rows.length === 0) {
      return sendError(res, 'Area parkir tidak ditemukan.', null, 404);
    }

    return sendSuccess(res, 'Detail area parkir berhasil diambil.', rows[0]);
  } catch (err) {
    return sendError(res, 'Gagal mengambil detail area parkir.', err);
  }
};

/**
 * Create Area Parkir (Admin)
 * POST /api/area
 */
const createArea = async (req, res) => {
  try {
    const { nama_area, kapasitas } = req.body;

    if (!nama_area || !kapasitas) {
      return sendError(res, 'Nama area dan kapasitas wajib diisi.', null, 400);
    }

    if (parseInt(kapasitas, 10) <= 0) {
      return sendError(res, 'Kapasitas area harus lebih besar dari 0.', null, 400);
    }

    const [result] = await db.query(
      'INSERT INTO tb_area_parkir (nama_area, kapasitas, terisi) VALUES (?, ?, 0)',
      [nama_area.trim(), parseInt(kapasitas, 10)]
    );

    await logAktivitas(req.user.id_user, `Admin membuat area parkir baru: ${nama_area} (Kapasitas: ${kapasitas})`);

    return sendSuccess(res, 'Area parkir berhasil ditambahkan.', {
      id_area: result.insertId,
      nama_area: nama_area.trim(),
      kapasitas: parseInt(kapasitas, 10),
      terisi: 0,
      sisa_slot: parseInt(kapasitas, 10)
    }, 201);
  } catch (err) {
    return sendError(res, 'Gagal menambahkan area parkir.', err);
  }
};

/**
 * Update Area Parkir (Admin)
 * PUT /api/area/:id
 */
const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_area, kapasitas } = req.body;

    const [existing] = await db.query('SELECT * FROM tb_area_parkir WHERE id_area = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'Area parkir tidak ditemukan.', null, 404);
    }

    const newKapasitas = kapasitas !== undefined ? parseInt(kapasitas, 10) : existing[0].kapasitas;
    const newNama = nama_area !== undefined ? nama_area.trim() : existing[0].nama_area;

    if (newKapasitas < existing[0].terisi) {
      return sendError(res, `Kapasitas baru (${newKapasitas}) tidak boleh lebih kecil dari jumlah kendaraan yang sedang terisi (${existing[0].terisi}).`, null, 400);
    }

    await db.query(
      'UPDATE tb_area_parkir SET nama_area = ?, kapasitas = ? WHERE id_area = ?',
      [newNama, newKapasitas, id]
    );

    await logAktivitas(req.user.id_user, `Admin memperbarui area parkir ID ${id}: ${newNama}`);

    return sendSuccess(res, 'Area parkir berhasil diperbarui.', {
      id_area: parseInt(id, 10),
      nama_area: newNama,
      kapasitas: newKapasitas,
      terisi: existing[0].terisi,
      sisa_slot: newKapasitas - existing[0].terisi
    });
  } catch (err) {
    return sendError(res, 'Gagal memperbarui area parkir.', err);
  }
};

/**
 * Delete Area Parkir (Admin)
 * DELETE /api/area/:id
 */
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM tb_area_parkir WHERE id_area = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'Area parkir tidak ditemukan.', null, 404);
    }

    if (existing[0].terisi > 0) {
      return sendError(res, `Area parkir tidak dapat dihapus karena masih ada ${existing[0].terisi} kendaraan yang sedang terparkir.`, null, 400);
    }

    await db.query('DELETE FROM tb_area_parkir WHERE id_area = ?', [id]);
    await logAktivitas(req.user.id_user, `Admin menghapus area parkir ID ${id} (${existing[0].nama_area})`);

    return sendSuccess(res, 'Area parkir berhasil dihapus.');
  } catch (err) {
    return sendError(res, 'Gagal menghapus area parkir. Pastikan data tidak terikat ke transaksi.', err);
  }
};

module.exports = {
  getAllArea,
  getAreaById,
  createArea,
  updateArea,
  deleteArea
};

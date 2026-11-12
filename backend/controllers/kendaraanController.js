const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAktivitas } = require('../utils/loggerHelper');

/**
 * Get All Kendaraan
 * GET /api/kendaraan?search=&jenis=&page=1&limit=10
 */
const getAllKendaraan = async (req, res) => {
  try {
    const { search = '', jenis = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = `
      SELECT 
        k.id_kendaraan,
        k.plat_nomor,
        k.jenis_kendaraan,
        k.warna,
        k.pemilik,
        k.id_user,
        u.nama_lengkap AS pencatat
      FROM tb_kendaraan k
      LEFT JOIN tb_user u ON k.id_user = u.id_user
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM tb_kendaraan WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      const pattern = `%${search}%`;
      query += ' AND (k.plat_nomor LIKE ? OR k.pemilik LIKE ?)';
      countQuery += ' AND (plat_nomor LIKE ? OR pemilik LIKE ?)';
      params.push(pattern, pattern);
      countParams.push(pattern, pattern);
    }

    if (jenis) {
      query += ' AND k.jenis_kendaraan = ?';
      countQuery += ' AND jenis_kendaraan = ?';
      params.push(jenis);
      countParams.push(jenis);
    }

    query += ' ORDER BY k.id_kendaraan DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await db.query(query, params);
    const [totalRows] = await db.query(countQuery, countParams);
    const total = totalRows[0].total;

    return sendSuccess(res, 'Data kendaraan berhasil diambil.', {
      kendaraan: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    return sendError(res, 'Gagal mengambil data kendaraan.', err);
  }
};

/**
 * Get Kendaraan By ID atau Plat Nomor
 * GET /api/kendaraan/:idOrPlat
 */
const getKendaraanByIdOrPlat = async (req, res) => {
  try {
    const { idOrPlat } = req.params;
    const isId = /^\d+$/.test(idOrPlat);

    let query = `
      SELECT 
        k.id_kendaraan,
        k.plat_nomor,
        k.jenis_kendaraan,
        k.warna,
        k.pemilik,
        k.id_user,
        u.nama_lengkap AS pencatat
      FROM tb_kendaraan k
      LEFT JOIN tb_user u ON k.id_user = u.id_user
      WHERE ${isId ? 'k.id_kendaraan = ?' : 'k.plat_nomor = ?'}
    `;

    const [rows] = await db.query(query, [idOrPlat]);

    if (rows.length === 0) {
      return sendError(res, 'Kendaraan tidak ditemukan.', null, 404);
    }

    return sendSuccess(res, 'Data kendaraan ditemukan.', rows[0]);
  } catch (err) {
    return sendError(res, 'Gagal mencari kendaraan.', err);
  }
};

/**
 * Create Kendaraan
 * POST /api/kendaraan
 */
const createKendaraan = async (req, res) => {
  try {
    const { plat_nomor, jenis_kendaraan, warna = '-', pemilik = 'Umum' } = req.body;

    if (!plat_nomor || !jenis_kendaraan) {
      return sendError(res, 'Plat nomor dan jenis kendaraan wajib diisi.', null, 400);
    }

    const cleanPlat = plat_nomor.trim().toUpperCase();

    // Cek duplikasi
    const [exists] = await db.query('SELECT id_kendaraan FROM tb_kendaraan WHERE plat_nomor = ?', [cleanPlat]);
    if (exists.length > 0) {
      return sendError(res, `Kendaraan dengan plat nomor '${cleanPlat}' sudah terdaftar.`, null, 409);
    }

    const [result] = await db.query(
      'INSERT INTO tb_kendaraan (plat_nomor, jenis_kendaraan, warna, pemilik, id_user) VALUES (?, ?, ?, ?, ?)',
      [cleanPlat, jenis_kendaraan.toLowerCase(), warna.trim(), pemilik.trim(), req.user.id_user]
    );

    await logAktivitas(req.user.id_user, `Mendaftarkan kendaraan baru: ${cleanPlat} (${jenis_kendaraan})`);

    return sendSuccess(res, 'Kendaraan berhasil didaftarkan.', {
      id_kendaraan: result.insertId,
      plat_nomor: cleanPlat,
      jenis_kendaraan: jenis_kendaraan.toLowerCase(),
      warna,
      pemilik
    }, 201);
  } catch (err) {
    return sendError(res, 'Gagal mendaftarkan kendaraan.', err);
  }
};

/**
 * Update Kendaraan
 * PUT /api/kendaraan/:id
 */
const updateKendaraan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plat_nomor, jenis_kendaraan, warna, pemilik } = req.body;

    const [existing] = await db.query('SELECT * FROM tb_kendaraan WHERE id_kendaraan = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'Data kendaraan tidak ditemukan.', null, 404);
    }

    const updatedPlat = plat_nomor ? plat_nomor.trim().toUpperCase() : existing[0].plat_nomor;
    const updatedJenis = jenis_kendaraan ? jenis_kendaraan.toLowerCase() : existing[0].jenis_kendaraan;
    const updatedWarna = warna !== undefined ? warna.trim() : existing[0].warna;
    const updatedPemilik = pemilik !== undefined ? pemilik.trim() : existing[0].pemilik;

    if (plat_nomor && updatedPlat !== existing[0].plat_nomor) {
      const [duplicate] = await db.query('SELECT id_kendaraan FROM tb_kendaraan WHERE plat_nomor = ? AND id_kendaraan != ?', [updatedPlat, id]);
      if (duplicate.length > 0) {
        return sendError(res, `Plat nomor '${updatedPlat}' sudah digunakan kendaraan lain.`, null, 409);
      }
    }

    await db.query(
      'UPDATE tb_kendaraan SET plat_nomor = ?, jenis_kendaraan = ?, warna = ?, pemilik = ? WHERE id_kendaraan = ?',
      [updatedPlat, updatedJenis, updatedWarna, updatedPemilik, id]
    );

    await logAktivitas(req.user.id_user, `Memperbarui data kendaraan ${updatedPlat}`);

    return sendSuccess(res, 'Data kendaraan berhasil diperbarui.', {
      id_kendaraan: parseInt(id, 10),
      plat_nomor: updatedPlat,
      jenis_kendaraan: updatedJenis,
      warna: updatedWarna,
      pemilik: updatedPemilik
    });
  } catch (err) {
    return sendError(res, 'Gagal memperbarui kendaraan.', err);
  }
};

/**
 * Delete Kendaraan (Admin only)
 * DELETE /api/kendaraan/:id
 */
const deleteKendaraan = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT plat_nomor FROM tb_kendaraan WHERE id_kendaraan = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'Kendaraan tidak ditemukan.', null, 404);
    }

    await db.query('DELETE FROM tb_kendaraan WHERE id_kendaraan = ?', [id]);
    await logAktivitas(req.user.id_user, `Menghapus kendaraan: ${existing[0].plat_nomor}`);

    return sendSuccess(res, 'Kendaraan berhasil dihapus.');
  } catch (err) {
    return sendError(res, 'Gagal menghapus kendaraan. Kendaraan ini masih memiliki riwayat transaksi.', err);
  }
};

module.exports = {
  getAllKendaraan,
  getKendaraanByIdOrPlat,
  createKendaraan,
  updateKendaraan,
  deleteKendaraan
};

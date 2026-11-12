const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Get Log Aktivitas (Admin)
 * GET /api/logs?search=&startDate=&endDate=&page=1&limit=15
 */
const getLogs = async (req, res) => {
  try {
    const { search = '', startDate = '', endDate = '', page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = `
      SELECT 
        l.id_log,
        l.aktivitas,
        l.waktu_aktivitas,
        u.id_user,
        u.nama_lengkap,
        u.username,
        u.role
      FROM tb_log_aktivitas l
      JOIN tb_user u ON l.id_user = u.id_user
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tb_log_aktivitas l
      JOIN tb_user u ON l.id_user = u.id_user
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    if (search) {
      const pattern = `%${search}%`;
      query += ' AND (l.aktivitas LIKE ? OR u.nama_lengkap LIKE ? OR u.username LIKE ?)';
      countQuery += ' AND (l.aktivitas LIKE ? OR u.nama_lengkap LIKE ? OR u.username LIKE ?)';
      params.push(pattern, pattern, pattern);
      countParams.push(pattern, pattern, pattern);
    }

    if (startDate) {
      query += ' AND DATE(l.waktu_aktivitas) >= ?';
      countQuery += ' AND DATE(l.waktu_aktivitas) >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(l.waktu_aktivitas) <= ?';
      countQuery += ' AND DATE(l.waktu_aktivitas) <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }

    query += ' ORDER BY l.id_log DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await db.query(query, params);
    const [totalRows] = await db.query(countQuery, countParams);
    const total = totalRows[0].total;

    return sendSuccess(res, 'Log aktivitas berhasil diambil.', {
      logs: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    return sendError(res, 'Gagal mengambil log aktivitas.', err);
  }
};

module.exports = {
  getLogs
};

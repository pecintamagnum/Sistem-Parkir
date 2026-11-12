const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendError } = require('../utils/responseHelper');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Akses ditolak: Token autentikasi tidak ditemukan.', null, 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'rahasia_super_aman_sistem_parkir_ukk_2026';

    const decoded = jwt.verify(token, secret);

    // Ambil user terbaru dari database untuk memastikan akun masih aktif
    const [rows] = await db.query(
      'SELECT id_user, nama_lengkap, username, role, status_aktif FROM tb_user WHERE id_user = ?',
      [decoded.id_user]
    );

    if (rows.length === 0) {
      return sendError(res, 'User tidak ditemukan atau sesi tidak valid.', null, 401);
    }

    const user = rows[0];
    if (user.status_aktif !== 1) {
      return sendError(res, 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.', null, 403);
    }

    // Attach user ke request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Sesi telah berakhir (Token Expired). Silakan login kembali.', err, 401);
    }
    return sendError(res, 'Token tidak valid.', err, 403);
  }
};

module.exports = {
  verifyToken
};

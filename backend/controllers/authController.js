const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAktivitas } = require('../utils/loggerHelper');

/**
 * Login User (Admin, Petugas, Owner)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username dan password wajib diisi.', null, 400);
    }

    // Cari user berdasarkan username
    const [rows] = await db.query(
      'SELECT id_user, nama_lengkap, username, password, role, status_aktif FROM tb_user WHERE username = ?',
      [username.trim()]
    );

    if (rows.length === 0) {
      return sendError(res, 'Username atau password salah.', null, 401);
    }

    const user = rows[0];

    // Cek apakah akun aktif
    if (user.status_aktif !== 1) {
      return sendError(res, 'Akun Anda dinonaktifkan. Hubungi Administrator.', null, 403);
    }

    // Verifikasi password dengan bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Username atau password salah.', null, 401);
    }

    // Buat JWT Token
    const payload = {
      id_user: user.id_user,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'rahasia_super_aman_sistem_parkir_ukk_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    const token = jwt.sign(payload, secret, { expiresIn });

    // Catat log aktivitas login
    await logAktivitas(user.id_user, `User '${user.username}' (${user.role}) berhasil login ke sistem`);

    return sendSuccess(res, 'Login berhasil.', {
      token,
      user: {
        id_user: user.id_user,
        nama_lengkap: user.nama_lengkap,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return sendError(res, 'Gagal memproses login.', err);
  }
};

/**
 * Logout User
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      await logAktivitas(req.user.id_user, `User '${req.user.username}' melakukan logout`);
    }
    return sendSuccess(res, 'Logout berhasil.');
  } catch (err) {
    return sendError(res, 'Gagal logout.', err);
  }
};

/**
 * Get Data User Yang Sedang Login (Profile)
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    return sendSuccess(res, 'Data pengguna berhasil diambil.', {
      user: req.user
    });
  } catch (err) {
    return sendError(res, 'Gagal mengambil data profil.', err);
  }
};

module.exports = {
  login,
  logout,
  getProfile
};

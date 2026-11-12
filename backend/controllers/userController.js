const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logAktivitas } = require('../utils/loggerHelper');

/**
 * Get All Users (Admin)
 * GET /api/users?search=&role=&page=1&limit=10
 */
const getAllUsers = async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = 'SELECT id_user, nama_lengkap, username, role, status_aktif FROM tb_user WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM tb_user WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (nama_lengkap LIKE ? OR username LIKE ?)';
      countQuery += ' AND (nama_lengkap LIKE ? OR username LIKE ?)';
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }

    query += ' ORDER BY id_user DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await db.query(query, params);
    const [totalRows] = await db.query(countQuery, countParams);
    const total = totalRows[0].total;

    return sendSuccess(res, 'Daftar user berhasil diambil.', {
      users: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    return sendError(res, 'Gagal mengambil data user.', err);
  }
};

/**
 * Get User By ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id_user, nama_lengkap, username, role, status_aktif FROM tb_user WHERE id_user = ?',
      [id]
    );

    if (rows.length === 0) {
      return sendError(res, 'User tidak ditemukan.', null, 404);
    }

    return sendSuccess(res, 'Detail user berhasil diambil.', rows[0]);
  } catch (err) {
    return sendError(res, 'Gagal mengambil detail user.', err);
  }
};

/**
 * Create User Baru (Admin)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { nama_lengkap, username, password, role, status_aktif = 1 } = req.body;

    if (!nama_lengkap || !username || !password || !role) {
      return sendError(res, 'Field nama_lengkap, username, password, dan role wajib diisi.', null, 400);
    }

    if (!['admin', 'petugas', 'owner'].includes(role)) {
      return sendError(res, "Role harus salah satu dari: 'admin', 'petugas', atau 'owner'.", null, 400);
    }

    // Cek duplikasi username
    const [exists] = await db.query('SELECT id_user FROM tb_user WHERE username = ?', [username.trim()]);
    if (exists.length > 0) {
      return sendError(res, `Username '${username}' sudah digunakan. Gunakan username lain.`, null, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO tb_user (nama_lengkap, username, password, role, status_aktif) VALUES (?, ?, ?, ?, ?)',
      [nama_lengkap.trim(), username.trim(), hashedPassword, role, status_aktif ? 1 : 0]
    );

    await logAktivitas(req.user.id_user, `Admin menambah user baru: ${username} (${role})`);

    return sendSuccess(res, 'User baru berhasil ditambahkan.', {
      id_user: result.insertId,
      nama_lengkap,
      username,
      role,
      status_aktif: status_aktif ? 1 : 0
    }, 201);
  } catch (err) {
    return sendError(res, 'Gagal menambahkan user baru.', err);
  }
};

/**
 * Update User (Admin)
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_lengkap, username, password, role, status_aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM tb_user WHERE id_user = ?', [id]);
    if (existing.length === 0) {
      return sendError(res, 'User tidak ditemukan.', null, 404);
    }

    // Cek duplikasi username jika username diganti
    if (username && username !== existing[0].username) {
      const [duplicate] = await db.query('SELECT id_user FROM tb_user WHERE username = ? AND id_user != ?', [username.trim(), id]);
      if (duplicate.length > 0) {
        return sendError(res, `Username '${username}' sudah digunakan.`, null, 409);
      }
    }

    const updatedNama = nama_lengkap !== undefined ? nama_lengkap.trim() : existing[0].nama_lengkap;
    const updatedUsername = username !== undefined ? username.trim() : existing[0].username;
    const updatedRole = role !== undefined ? role : existing[0].role;
    const updatedStatus = status_aktif !== undefined ? (status_aktif ? 1 : 0) : existing[0].status_aktif;

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE tb_user SET nama_lengkap = ?, username = ?, password = ?, role = ?, status_aktif = ? WHERE id_user = ?',
        [updatedNama, updatedUsername, hashedPassword, updatedRole, updatedStatus, id]
      );
    } else {
      await db.query(
        'UPDATE tb_user SET nama_lengkap = ?, username = ?, role = ?, status_aktif = ? WHERE id_user = ?',
        [updatedNama, updatedUsername, updatedRole, updatedStatus, id]
      );
    }

    await logAktivitas(req.user.id_user, `Admin memperbarui user ID ${id}: ${updatedUsername}`);

    return sendSuccess(res, 'Data user berhasil diperbarui.', {
      id_user: parseInt(id, 10),
      nama_lengkap: updatedNama,
      username: updatedUsername,
      role: updatedRole,
      status_aktif: updatedStatus
    });
  } catch (err) {
    return sendError(res, 'Gagal memperbarui user.', err);
  }
};

/**
 * Delete User (Admin)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id_user) {
      return sendError(res, 'Anda tidak dapat menghapus akun Anda sendiri.', null, 400);
    }

    const [user] = await db.query('SELECT username FROM tb_user WHERE id_user = ?', [id]);
    if (user.length === 0) {
      return sendError(res, 'User tidak ditemukan.', null, 404);
    }

    await db.query('DELETE FROM tb_user WHERE id_user = ?', [id]);
    await logAktivitas(req.user.id_user, `Admin menghapus user: ${user[0].username} (ID: ${id})`);

    return sendSuccess(res, `User '${user[0].username}' berhasil dihapus.`);
  } catch (err) {
    return sendError(res, 'Gagal menghapus user. Pastikan data tidak terikat dengan transaksi.', err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

const { sendError } = require('../utils/responseHelper');

/**
 * Middleware untuk membatasi akses endpoint berdasarkan role
 * @param  {...string} allowedRoles - Role yang diperbolehkan (contoh: 'admin', 'petugas', 'owner')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Akses ditolak: Data pengguna tidak ditemukan.', null, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Akses dilarang: Role '${req.user.role}' tidak memiliki izin untuk fitur ini.`,
        null,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};

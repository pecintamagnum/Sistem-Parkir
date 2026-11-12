const { sendError } = require('../utils/responseHelper');

const notFoundHandler = (req, res, next) => {
  return sendError(res, `Endpoint URL '${req.originalUrl}' tidak ditemukan.`, null, 404);
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]', err);
  const status = err.status || 500;
  return sendError(
    res,
    err.message || 'Terjadi kesalahan internal pada server.',
    process.env.NODE_ENV === 'development' ? err.stack : null,
    status
  );
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};

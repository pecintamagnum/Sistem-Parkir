/**
 * Format Response Standar untuk Frontend
 */

const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const payload = {
    success: true,
    message,
  };
  if (data !== null) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
};

const sendError = (res, message, error = null, statusCode = 500) => {
  const payload = {
    success: false,
    message,
  };
  if (error !== null) {
    payload.error = typeof error === 'string' ? error : (error.message || error);
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};

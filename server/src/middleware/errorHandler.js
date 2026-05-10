import ApiError from '../utils/ApiError.js';

// Global error handler — must be the last middleware in app.js
// Handles all errors forwarded via next(err) or thrown in asyncHandler

const errorHandler = (err, req, res, next) => {

  console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);

  // Our own ApiError (thrown manually in controllers)
  if (err.name === 'ApiError') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Multer errors — file upload issues
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(422).json({
      success: false,
      message: 'File size exceeds the maximum allowed limit',
    });
  }

  if (err.message === 'Unexpected end of form') {
    return res.status(400).json({
      success: false,
      message: 'No file received — make sure you are sending multipart/form-data with a file attached',
    });
  }

  // PostgreSQL: unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  // PostgreSQL: foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  // JWT: invalid token
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // JWT: token expired
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired, please log in again',
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Fallback
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

export default errorHandler;
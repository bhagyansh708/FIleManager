/**
 * Global Error Handler Middleware
 * Ensures consistent error responses with generic messages to clients
 * Logs detailed errors server-side for debugging
 */
const errorHandler = (err, req, res, next) => {
  // Log detailed error server-side
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Prepare error response
  const errorResponse = {
    success: false,
    message: isDevelopment ? err.message : 'Internal Server Error',
  };

  // Add error details only in development
  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};

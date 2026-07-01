/**
 * Global error handling middleware.
 * Must have exactly 4 parameters (err, req, res, next) for Express
 * to recognise it as an error handler.
 * Mount this LAST in server.js, after all routes.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose: document not found (bad ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found — invalid ID: ${err.value}`;
  }

  // Mongoose: duplicate key (e.g. duplicate phone number)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: '${field}'. Please use a different value.`;
  }

  // Mongoose: validation errors (required fields, enum violations, etc.)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose the full stack trace in development — never in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

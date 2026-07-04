const jwt = require('jsonwebtoken');

/**
 * Auth middleware — verifies the JWT on protected routes.
 *
 * Expected header format:  Authorization: Bearer <token>
 *
 * On success:  attaches the decoded payload ({ userId, role }) to req.user
 *              and calls next() to proceed to the route handler.
 * On failure:  returns 401 immediately — the route handler is never reached.
 *
 * Usage (when Phase 3 routes need protection):
 *   const protect = require('../middleware/authMiddleware');
 *   router.get('/protected-route', protect, controllerFn);
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect "Bearer <token>" — reject anything else
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorised — no token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded payload so downstream handlers can access req.user.userId / req.user.role
    req.user = decoded;
    next();
  } catch (error) {
    // jwt.verify throws for expired, malformed, or tampered tokens
    return res.status(401).json({
      success: false,
      message: 'Not authorised — token invalid or expired',
    });
  }
};

module.exports = protect;

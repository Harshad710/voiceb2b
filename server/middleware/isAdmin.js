/**
 * isAdmin middleware — role-based access guard.
 *
 * MUST be mounted AFTER authMiddleware, because it relies on req.user
 * already being populated by the JWT verification step.
 *
 * Usage:
 *   const protect  = require('./authMiddleware');
 *   const isAdmin  = require('./isAdmin');
 *   router.get('/protected', protect, isAdmin, handler);
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden — admin access required',
    });
  }
  next();
};

module.exports = isAdmin;

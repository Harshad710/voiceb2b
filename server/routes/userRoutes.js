const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const protect  = require('../middleware/authMiddleware');
const isAdmin  = require('../middleware/isAdmin');

// All user-management routes are admin-only.
// This closes the role-tampering hole: POST /api/users can no longer be used
// by anonymous clients to create arbitrary-role accounts. Self-registration
// must go through POST /api/auth/register, which hard-codes role: 'RETAILER'.

// ── /api/users ───────────────────────────────────────────────────────────────
router.route('/')
  .get(protect, isAdmin, getUsers)
  .post(protect, isAdmin, createUser);

// ── /api/users/:id ───────────────────────────────────────────────────────────
router.route('/:id')
  .get(protect, isAdmin, getUserById)
  .put(protect, isAdmin, updateUser)
  .delete(protect, isAdmin, deleteUser);

module.exports = router;

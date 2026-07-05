const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const protect  = require('../middleware/authMiddleware');
const isAdmin  = require('../middleware/isAdmin');

// ── /api/products ─────────────────────────────────────────────────────────────
// GET  — Public: retailers must be able to browse the catalog without any token
// POST — Admin only: creating catalog entries
router.route('/')
  .get(getProducts)
  .post(protect, isAdmin, createProduct);

// ── /api/products/:id ─────────────────────────────────────────────────────────
// GET    — Public: retailer product detail view (Phase 3)
// PUT    — Admin only: editing a catalog entry
// DELETE — Admin only: removing a catalog entry
router.route('/:id')
  .get(getProductById)
  .put(protect, isAdmin, updateProduct)
  .delete(protect, isAdmin, deleteProduct);

module.exports = router;

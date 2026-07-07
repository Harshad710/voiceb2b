const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrdersByRetailer,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require('../controllers/orderController');

const protect  = require('../middleware/authMiddleware');
const isAdmin  = require('../middleware/isAdmin');

// ── /api/orders ──────────────────────────────────────────────────────────────
// GET  — Admin: list ALL orders across all retailers          → admin-protected (unchanged)
// POST — Retailer: submit a new order                        → identity-protected (Phase 3a)
router.route('/')
  .get(protect, isAdmin, getOrders)
  .post(protect, createOrder);

// ── /api/orders/retailer/:retailerId ─────────────────────────────────────────
// NOTE: Defined BEFORE /:id so Express doesn't swallow "retailer" as a dynamic id.
// This ordering is load-bearing — do NOT move this block below /:id.
// GET — Retailer: fetch their own order history              → identity-protected (Phase 3a)
router.route('/retailer/:retailerId').get(protect, getOrdersByRetailer);

// ── /api/orders/:id ──────────────────────────────────────────────────────────
// GET — single order detail                                  → identity-protected (Phase 3a)
router.route('/:id').get(protect, getOrderById);

// ── /api/orders/:id/status ───────────────────────────────────────────────────
// PATCH — Admin: advance order through PENDING→PROCESSING→DELIVERED  → protected
router.route('/:id/status').patch(protect, isAdmin, updateOrderStatus);

module.exports = router;

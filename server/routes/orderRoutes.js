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
// GET  — Admin: list ALL orders across all retailers          → protected
// POST — Retailer: submit a new order                        → open (Phase 3 auth added later)
router.route('/')
  .get(protect, isAdmin, getOrders)
  .post(createOrder);

// ── /api/orders/retailer/:retailerId ─────────────────────────────────────────
// NOTE: Defined BEFORE /:id so Express doesn't swallow "retailer" as a dynamic id.
// GET — Retailer: fetch their own order history              → open (Phase 3 concern)
router.route('/retailer/:retailerId').get(getOrdersByRetailer);

// ── /api/orders/:id ──────────────────────────────────────────────────────────
// GET — single order detail                                  → open for now
router.route('/:id').get(getOrderById);

// ── /api/orders/:id/status ───────────────────────────────────────────────────
// PATCH — Admin: advance order through PENDING→PROCESSING→DELIVERED  → protected
router.route('/:id/status').patch(protect, isAdmin, updateOrderStatus);

module.exports = router;

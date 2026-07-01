const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrdersByRetailer,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require('../controllers/orderController');

// /api/orders         — Admin: list all orders
// /api/orders         — Retailer: submit new order
router.route('/').get(getOrders).post(createOrder);

// /api/orders/retailer/:retailerId  — Retailer: fetch their own order history
// NOTE: This specific route must be defined BEFORE /:id to avoid Express
// treating "retailer" as a dynamic :id segment.
router.route('/retailer/:retailerId').get(getOrdersByRetailer);

// /api/orders/:id              — Get single order detail
router.route('/:id').get(getOrderById);

// /api/orders/:id/status       — Admin: update status only (PATCH)
router.route('/:id/status').patch(updateOrderStatus);

module.exports = router;

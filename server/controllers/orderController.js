const Order = require('../models/Order');

// @desc    Get all orders (Admin view — all orders across all retailers)
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('retailerId', 'name phone') // surface useful retailer fields
      .populate('items.productId', 'name brand price'); // surface product details per line item
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for a specific retailer
// @route   GET /api/orders/retailer/:retailerId
// @access  Private (Retailer — their own orders only)
const getOrdersByRetailer = async (req, res, next) => {
  try {
    const orders = await Order.find({ retailerId: req.params.retailerId })
      .populate('items.productId', 'name brand price')
      .sort({ createdAt: -1 }); // most recent first
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('retailerId', 'name phone')
      .populate('items.productId', 'name brand price');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new order (triggered by retailer checkout)
// @route   POST /api/orders
// @access  Private (Retailer)
const createOrder = async (req, res, next) => {
  try {
    const { retailerId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Server calculates totalAmount — never trust a client-supplied total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.priceAtPurchase);
    }, 0);

    const order = await Order.create({
      retailerId,
      items,
      totalAmount,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin workflow: PENDING -> PROCESSING -> DELIVERED)
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Guard: only allow valid status transitions
    const validStatuses = ['PENDING', 'PROCESSING', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// NOTE: Full DELETE for orders is intentionally omitted per PRD.
// Orders should be retained for audit/history even if cancelled.

module.exports = {
  getOrders,
  getOrdersByRetailer,
  getOrderById,
  createOrder,
  updateOrderStatus,
};

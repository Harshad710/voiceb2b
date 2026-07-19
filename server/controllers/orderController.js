const Order = require('../models/Order');
const Product = require('../models/Product');
// @desc    Get all orders (Admin view — all orders across all retailers)
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('retailerId', 'name phone') // surface useful retailer fields
      .populate('items.productId'); // surface full product details per line item
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for a specific retailer
// @route   GET /api/orders/retailer/:retailerId
// @access  Private (Retailer — their own orders only; Admin can see any)
const getOrdersByRetailer = async (req, res, next) => {
  try {
    // Ownership check: a retailer may only request their own order history.
    // Admins are exempt so they can look up any retailer's orders if needed.
    if (
      req.params.retailerId !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — cannot view another retailer's orders",
      });
    }

    const orders = await Order.find({ retailerId: req.params.retailerId })
      .populate('items.productId')
      .sort({ createdAt: -1 }); // most recent first
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Retailer — own orders only; Admin — any order)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('retailerId', 'name phone')
      .populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ownership check: order.retailerId is a Mongoose ObjectId, so .toString()
    // is required before comparing against the string userId from the JWT payload.
    if (
      order.retailerId._id.toString() !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden — cannot view another retailer's orders",
      });
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
    const { items } = req.body;
    const retailerId = req.user.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Fetch all referenced products in one query — this is the step that was
    // missing. The client sends only {productId, quantity}; the server looks
    // up each product's CURRENT price and uses that as priceAtPurchase (a
    // snapshot at order time — future price changes must never retroactively
    // alter this order, per the existing schema decision).
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Key the lookup map by string id — ObjectId !== ObjectId with strict
    // equality even for the same value, so always .toString() first.
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId.toString());
      if (!product) {
        const err = new Error(`Product not found: ${item.productId}`);
        err.statusCode = 400;
        throw err;
      }
      const priceAtPurchase = product.price;
      totalAmount += priceAtPurchase * item.quantity;
      return { productId: item.productId, quantity: item.quantity, priceAtPurchase };
    });

    const daysToAdd = Math.floor(Math.random() * 4) + 1;
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + daysToAdd);

    const order = await Order.create({
      retailerId,
      items: orderItems,
      totalAmount,
      expectedDeliveryDate,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
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

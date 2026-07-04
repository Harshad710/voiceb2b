const mongoose = require('mongoose');

// Sub-schema for each line item within an order
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    // Snapshot of price at time of purchase — decoupled from live product price
    priceAtPurchase: {
      type: Number,
      required: [true, 'Price at purchase is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false } // sub-documents don't need their own _id
);

const orderSchema = new mongoose.Schema(
  {
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Retailer reference is required'],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'PROCESSING', 'DELIVERED'],
        message: 'Status must be PENDING, PROCESSING, or DELIVERED',
      },
      default: 'PENDING',
    },
    // Estimated delivery date — computed server-side as today + 1-4 days.
    // Displayed in the retailer's order history so they know when to expect delivery.
    expectedDeliveryDate: {
      type: Date,
      required: [true, 'Expected delivery date is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);

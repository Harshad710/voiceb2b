const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    weight: {
      // Stored as a string to support flexible units e.g. "500g", "1kg", "200ml"
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // Core hook for Phase 2 voice/fuzzy search:
    // e.g. ["sabun", "soap", "dhone wala", "bar soap"]
    aliases: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index on name and aliases to enable MongoDB $text search later
productSchema.index({ name: 'text', aliases: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);

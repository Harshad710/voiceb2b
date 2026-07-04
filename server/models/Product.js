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
    // Category enables Phase 3 catalog filtering (e.g. "Detergents", "Snacks")
    category: {
      type: String,
      required: [true, 'Category is required'],
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
    // Optional product image for the retailer-facing shop UI (Phase 3)
    imageUrl: {
      type: String,
      trim: true,
    },
    // Core hook for Phase 3 voice/fuzzy search:
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

// Text index on name, aliases, and brand to enable MongoDB $text search later
productSchema.index({ name: 'text', aliases: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);

const Product = require('../models/Product');
const Fuse   = require('fuse.js');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin only)
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product (including price, stock, aliases)
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products (two-stage: MongoDB $text → Fuse.js fallback)
// @route   GET /api/products/search?q=<query>
// @access  Public
const getSearchResults = async (req, res, next) => {
  try {
    // ── 1. Input validation ───────────────────────────────────────────────────
    const q = (req.query.q || '').trim();
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: 'Search query is required' });
    }

    // ── 2. Stage 1: MongoDB $text search ─────────────────────────────────────
    // Full documents returned; score projected for sorting only — stripped
    // before response so no extra field leaks beyond what the schema defines.
    const textResults = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    if (textResults.length > 0) {
      // Short-circuit: return exact matches immediately, do NOT run fuzzy stage.
      const data = textResults.map((doc) => {
        const plain = doc.toObject();
        delete plain.score; // strip the $text projection field
        return plain;
      });
      return res
        .status(200)
        .json({ success: true, count: data.length, matchType: 'exact', data });
    }

    // ── 3. Stage 2: Fuse.js fuzzy fallback (only reached when Stage 1 = 0) ───
    // Load full catalog — no inStock filter, mirroring GET /api/products exactly.
    const allProducts = await Product.find();

    // threshold: 0.4 is a starting point — tune this value as the catalog grows.
    // Keys are weighted roughly evenly because generic/shorthand terms (e.g. "chips")
    // exist only in aliases, never in name — under-weighting aliases would defeat
    // the purpose of this fallback.
    const fuse = new Fuse(allProducts, {
      keys: [
        { name: 'name',    weight: 0.35 },
        { name: 'aliases', weight: 0.40 },
        { name: 'brand',   weight: 0.25 },
      ],
      threshold: 0.4,
      includeScore: true,
    });

    const fuseResults = fuse.search(q).slice(0, 5); // cap at top 5

    if (fuseResults.length > 0) {
      // Extract .item (the Mongoose doc); Fuse's own .score stays on the wrapper.
      const data = fuseResults.map(({ item }) => item.toObject());
      return res
        .status(200)
        .json({ success: true, count: data.length, matchType: 'fuzzy', data });
    }

    // ── 4. Both stages returned zero results — valid 200, not a 404 ───────────
    return res
      .status(200)
      .json({ success: true, count: 0, matchType: 'none', data: [] });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSearchResults,
};

/**
 * seed-products.js — Catalog seed script.
 *
 * Populates the Product collection with realistic FMCG products for
 * Phase 3 (retailer catalog browse) and lays the alias groundwork for
 * Phase 4 (fuzzy search) and Phase 5 (voice search).
 *
 * This script is NEVER imported by server.js or exposed as an API route.
 * Run it manually from the server/ directory:
 *
 *   node scripts/seed-products.js
 *
 * Safe to re-run: each product is matched on {name, brand} and upserted,
 * so re-running updates existing entries in place and adds any missing
 * ones — it never creates duplicates and never wipes the collection.
 */

const path     = require('path');
const mongoose = require('mongoose');
const dotenv   = require('dotenv');

// Load .env from the server/ directory (one level up from scripts/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import AFTER dotenv so MONGODB_URI is available
const Product = require('../models/Product');

// ── Image placeholders ────────────────────────────────────────────────────
// SELF-CONTAINED SVG data URIs — deliberately NOT an external placeholder
// service. An earlier version of this script used placehold.co with an
// emoji in the ?text= param; on render, the emoji glyphs came back blank
// (placehold.co's font doesn't support them), which would have silently
// shipped 23 broken product images. Generating the icon as inline SVG here
// removes that failure mode entirely — nothing to fetch, nothing that can
// go down or change its font stack later. Still accent-tinted / icon-only,
// matching the approved Phase 3 mockup spec (image is the primary
// recognition cue, text is secondary). Swapping in real photos later is
// just an imageUrl field change — nothing structural depends on this.
//
// Colors match the locked-in Shikhar-aligned blue palette:
const BG_COLOR   = '#E6F1FB'; // blue-50 tint
const ICON_COLOR = '#185FA5'; // primary accent

const CATEGORY_ICON_SHAPES = {
  'Staples': `
    <line x1="100" y1="50" x2="100" y2="150" stroke="${ICON_COLOR}" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="80" cy="70" rx="12" ry="20" fill="${ICON_COLOR}" transform="rotate(-30 80 70)"/>
    <ellipse cx="120" cy="70" rx="12" ry="20" fill="${ICON_COLOR}" transform="rotate(30 120 70)"/>
    <ellipse cx="80" cy="100" rx="12" ry="20" fill="${ICON_COLOR}" transform="rotate(-30 80 100)"/>
    <ellipse cx="120" cy="100" rx="12" ry="20" fill="${ICON_COLOR}" transform="rotate(30 120 100)"/>
    <ellipse cx="80" cy="130" rx="12" ry="20" fill="${ICON_COLOR}" transform="rotate(-30 80 130)"/>
    <ellipse cx="120" cy="130" rx="12" ry="20" fill="${ICON_COLOR}" transform="rotate(30 120 130)"/>
  `,
  'Beverages': `
    <path d="M70 70 L130 70 L120 160 Q100 170 80 160 Z" fill="none" stroke="${ICON_COLOR}" stroke-width="6" stroke-linejoin="round"/>
    <line x1="110" y1="70" x2="115" y2="40" stroke="${ICON_COLOR}" stroke-width="6" stroke-linecap="round"/>
  `,
  'Snacks': `
    <circle cx="100" cy="100" r="55" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
    <circle cx="80" cy="80" r="6" fill="${ICON_COLOR}"/>
    <circle cx="120" cy="85" r="6" fill="${ICON_COLOR}"/>
    <circle cx="100" cy="110" r="6" fill="${ICON_COLOR}"/>
    <circle cx="75" cy="120" r="6" fill="${ICON_COLOR}"/>
    <circle cx="125" cy="125" r="6" fill="${ICON_COLOR}"/>
  `,
  'Personal care': `
    <rect x="80" y="90" width="40" height="80" rx="8" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
    <rect x="90" y="65" width="20" height="25" rx="4" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
    <line x1="80" y1="115" x2="120" y2="115" stroke="${ICON_COLOR}" stroke-width="4"/>
  `,
  'Home care': `
    <rect x="75" y="100" width="50" height="70" rx="8" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
    <rect x="90" y="75" width="15" height="25" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
    <path d="M105 80 L135 65" stroke="${ICON_COLOR}" stroke-width="6" stroke-linecap="round"/>
    <path d="M105 90 L130 85" stroke="${ICON_COLOR}" stroke-width="6" stroke-linecap="round"/>
  `,
  'Confectionery': `
    <rect x="65" y="70" width="70" height="60" rx="6" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
    <line x1="100" y1="70" x2="100" y2="130" stroke="${ICON_COLOR}" stroke-width="4"/>
    <line x1="65" y1="100" x2="135" y2="100" stroke="${ICON_COLOR}" stroke-width="4"/>
  `,
};

// Generic fallback (simple box outline) for any category not in the map above —
// keeps the seed script forward-compatible if a new category is added later
// without needing a matching icon drawn immediately.
const DEFAULT_ICON_SHAPE = `
  <rect x="70" y="70" width="60" height="60" rx="8" fill="none" stroke="${ICON_COLOR}" stroke-width="6"/>
`;

const imageFor = (category) => {
  const shape = CATEGORY_ICON_SHAPES[category] || DEFAULT_ICON_SHAPE;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${BG_COLOR}"/>
    ${shape}
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// ── Product data ───────────────────────────────────────────────────────────
// Aliases follow a 4-part taxonomy per product (not templated — generic
// aliases only make sense on genuinely generic items):
//   1. English misspelling/typo        — fat-finger typing
//   2. Hindi/Hinglish phonetic (Latin) — spoken/voice search in the
//                                        retailer's actual language
//   3. Dropped-letter / slurred speech — fast or mumbled STT transcription
//   4. Generic/shorthand term          — category-level or brand-shorthand
// Devanagari script is deliberately excluded — that's a Phase 5 concern once
// the actual STT pipeline's output format is known, not something to guess
// at now.

const products = [
  // Staples
  { name: 'Tata Salt', brand: 'Tata', category: 'Staples', weight: '1kg', price: 28,
    aliases: ['namak', 'tata namak', 'salr', 'tata slat', 'nimak', 'salt'] },
  { name: 'Aashirvaad Atta', brand: 'ITC', category: 'Staples', weight: '5kg', price: 235,
    aliases: ['atta', 'ashirwad atta', 'ashirvad', 'aata', 'flour', 'gehu ka atta'] },
  { name: 'India Gate Basmati Rice', brand: 'India Gate', category: 'Staples', weight: '1kg', price: 95,
    aliases: ['chawal', 'basmati chaval', 'rice', 'indya gate', 'basmti rice', 'chaval'] },
  { name: 'Fortune Sunflower Oil', brand: 'Fortune', category: 'Staples', weight: '1L', price: 145,
    aliases: ['tel', 'sunflower tel', 'fortun oil', 'khana ka tel', 'cooking oil', 'fortune tel'] },
  { name: 'Tata Sampann Toor Dal', brand: 'Tata', category: 'Staples', weight: '1kg', price: 165,
    aliases: ['dal', 'toor dal', 'arhar dal', 'tuar dal', 'tata dal', 'sampan dal'] },

  // Beverages
  { name: 'Tata Tea Gold', brand: 'Tata', category: 'Beverages', weight: '500g', price: 260,
    aliases: ['chai', 'chai patti', 'tata chai', 'tea patti', 'tee', 'chai pati'] },
  { name: 'Nescafe Classic Coffee', brand: 'Nestle', category: 'Beverages', weight: '50g', price: 165,
    aliases: ['coffee', 'kophi', 'nescafe classik', 'nes cafe', 'coffe powder'] },
  { name: 'Frooti', brand: 'Parle Agro', category: 'Beverages', weight: '200ml', price: 15,
    aliases: ['mango drink', 'fruti', 'frutti', 'aam ka juice', 'mango juice'] },
  { name: 'Bisleri Mineral Water', brand: 'Bisleri', category: 'Beverages', weight: '1L', price: 20,
    aliases: ['pani', 'paani bottle', 'bisleri botal', 'bisleri water', 'water bottle', 'bisliri'] },

  // Snacks
  { name: 'Lays Classic Salted', brand: 'PepsiCo', category: 'Snacks', weight: '52g', price: 20,
    aliases: ['chips', 'leys', 'lehz', 'aalu chips', 'potato chips', 'lays'] },
  { name: 'Parle-G Biscuits', brand: 'Parle', category: 'Snacks', weight: '100g', price: 10,
    aliases: ['biscuit', 'parle g', 'parlee ji', 'glucose biscuit', 'parle-ji', 'biscut'] },
  { name: "Haldiram's Aloo Bhujia", brand: "Haldiram's", category: 'Snacks', weight: '200g', price: 45,
    aliases: ['bhujia', 'aalu bhujiya', 'haldiram bhujiya', 'namkeen', 'haldirams'] },
  { name: 'Britannia Good Day', brand: 'Britannia', category: 'Snacks', weight: '100g', price: 30,
    aliases: ['good day biscuit', 'gud day', 'britania', 'cashew biscuit', 'guday'] },
  { name: 'Kurkure Masala Munch', brand: 'PepsiCo', category: 'Snacks', weight: '55g', price: 20,
    aliases: ['kurkurey', 'kurkure masala', 'krukure', 'spicy snack', 'kurkary'] },

  // Personal care
  { name: 'Lifebuoy Soap', brand: 'Unilever', category: 'Personal care', weight: '100g', price: 32,
    aliases: ['sabun', 'life boy', 'nahane ka sabun', 'lifeboy soap', 'bathing soap', 'sabon'] },
  { name: 'Colgate Strong Teeth Toothpaste', brand: 'Colgate', category: 'Personal care', weight: '100g', price: 55,
    aliases: ['colgate', 'dant manjan', 'toothpaste', 'colget', 'paste', 'danth majan'] },
  { name: 'Head & Shoulders Shampoo', brand: 'P&G', category: 'Personal care', weight: '180ml', price: 165,
    aliases: ['shampoo', 'head n shoulder', 'shampu', 'hair wash', 'head sholders'] },
  { name: 'Dettol Handwash', brand: 'Reckitt', category: 'Personal care', weight: '200ml', price: 85,
    aliases: ['handwash', 'detol', 'haath dhone wala', 'hand soap liquid', 'detol handwash'] },

  // Home care
  { name: 'Surf Excel Easy Wash Detergent', brand: 'Unilever', category: 'Home care', weight: '1kg', price: 120,
    aliases: ['surf', 'kapde dhone wala powder', 'safe excel', 'detergent powder', 'surph', 'washing powder'] },
  { name: 'Vim Dishwash Bar', brand: 'Unilever', category: 'Home care', weight: '200g', price: 20,
    aliases: ['vim bar', 'bartan dhone wala', 'vim', 'dishwash saban', 'bartan sabun', 'vim bhar'] },
  { name: 'Harpic Toilet Cleaner', brand: 'Reckitt', category: 'Home care', weight: '500ml', price: 95,
    aliases: ['harpik', 'toilet safai', 'bathroom cleaner', 'harpic clener', 'toilet cleaner liquid'] },

  // Confectionery
  { name: 'Cadbury Dairy Milk', brand: 'Mondelez', category: 'Confectionery', weight: '55g', price: 40,
    aliases: ['chocolate', 'dairy milk choklate', 'cadbary', 'chaklet', 'milk chocolate'] },
  { name: 'Amul Butter', brand: 'Amul', category: 'Confectionery', weight: '100g', price: 56,
    aliases: ['makhan', 'amul makhan', 'butter', 'amull', 'makhkan'] },
];

// ── Run ──────────────────────────────────────────────────────────────────
const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set in .env — cannot connect.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦  MongoDB connected.');

  let insertedCount = 0;
  let updatedCount  = 0;

  for (const product of products) {
    const doc = {
      ...product,
      imageUrl: imageFor(product.category),
      inStock: true,
    };

    const result = await Product.findOneAndUpdate(
      { name: doc.name, brand: doc.brand },
      { $set: doc },
      { upsert: true, new: true, rawResult: true, setDefaultsOnInsert: true }
    );

    if (result.lastErrorObject && result.lastErrorObject.upserted) {
      insertedCount += 1;
    } else {
      updatedCount += 1;
    }
  }

  const total = await Product.countDocuments();

  console.log('✅  Seed complete.');
  console.log(`    Inserted : ${insertedCount}`);
  console.log(`    Updated  : ${updatedCount}`);
  console.log(`    Total products in collection now: ${total}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌  Failed to seed products:', err.message);
  process.exit(1);
});
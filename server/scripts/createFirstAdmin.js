/**
 * createFirstAdmin.js — One-time bootstrap script.
 *
 * Creates the first ADMIN user directly in MongoDB.
 * This script is NEVER imported by server.js or exposed as an API route.
 * Run it manually, once, from the server/ directory:
 *
 *   node scripts/createFirstAdmin.js [name] [phone] [password]
 *
 * Arguments are positional and optional — defaults are used if omitted:
 *   node scripts/createFirstAdmin.js "Harshad Jain" 9000000000 MySecret@123
 *
 * The password is hashed automatically by the User model's pre-save hook.
 */

const path     = require('path');
const mongoose = require('mongoose');
const dotenv   = require('dotenv');

// Load .env from the server/ directory (one level up from scripts/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import AFTER dotenv so MONGODB_URI is available
const User = require('../models/User');

// ── Configurable values — edit these or pass as CLI args ─────────────────────
const NAME     = process.argv[2] || 'VoiceB2B Admin';
const PHONE    = process.argv[3] || '9000000000';
const PASSWORD = process.argv[4] || 'Admin@1234';

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set in .env — cannot connect.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦  MongoDB connected.');

  // Check if an admin with this phone already exists to avoid duplicates
  const existing = await User.findOne({ phone: PHONE });
  if (existing) {
    console.warn(`⚠️  A user with phone ${PHONE} already exists (role: ${existing.role}).`);
    console.warn('    If you need to re-create, delete the existing document first.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // role is explicitly set to 'ADMIN' here — this is the ONLY place in the
  // codebase that can legitimately create an ADMIN account outside of MongoDB.
  const admin = await User.create({
    name: NAME,
    phone: PHONE,
    password: PASSWORD, // plaintext — hashed by User pre-save hook before DB write
    role: 'ADMIN',
  });

  console.log('✅  Admin account created successfully!');
  console.log(`    Name  : ${admin.name}`);
  console.log(`    Phone : ${admin.phone}  ← use this to log in`);
  console.log(`    Role  : ${admin.role}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌  Failed to create admin:', err.message);
  process.exit(1);
});

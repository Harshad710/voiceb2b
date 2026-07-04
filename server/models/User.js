const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // Cost factor — higher = slower hash = harder to brute-force

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['RETAILER', 'ADMIN'],
        message: 'Role must be either RETAILER or ADMIN',
      },
      required: [true, 'Role is required'],
      default: 'RETAILER',
    },
    // select: false — the hash is NEVER returned in any query result unless
    // the caller explicitly opts in with .select('+password').
    // This prevents accidental password leaks in API responses.
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    // Optional delivery address for the retailer's shop location
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ── Pre-save hook: hash password before writing to DB ────────────────────────
// The `isModified` check ensures we only re-hash when the plaintext password
// field is actually changed — prevents re-hashing an already-hashed value
// if an unrelated field (e.g. address) is updated later.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ── Instance method: compare a plaintext candidate against the stored hash ───
// Used in authController.login after explicitly fetching the password field.
// bcrypt.compare handles the salt extraction and comparison internally.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

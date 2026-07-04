const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helper: signs a JWT and returns the response shape used by both
 * register and login — keeping the two endpoints consistent.
 *
 * Payload: { userId, role }
 * Expiry:  7 days
 * Secret:  JWT_SECRET from .env
 */
const signTokenAndRespond = (user, statusCode, res) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Build the user object to return — never include the password hash
  const userData = {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    address: user.address,
  };

  res.status(statusCode).json({
    success: true,
    token,
    data: userData,
  });
};

// @desc    Register a new retailer account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Destructure only the fields we accept — role is intentionally excluded.
    // Even if the client sends role: 'ADMIN', it will be silently discarded.
    const { name, phone, password, address } = req.body;

    // Hard-code role to RETAILER — this is the privilege escalation guard.
    // Self-registration can ONLY ever create retailer accounts.
    const user = await User.create({
      name,
      phone,
      password, // plaintext here — the pre-save hook hashes it before DB write
      address,
      role: 'RETAILER',
    });

    // Auto-login the user immediately after registration — better UX
    signTokenAndRespond(user, 201, res);
  } catch (error) {
    // Duplicate phone (11000) and validation errors are handled by
    // the global errorHandler middleware — no need to duplicate that logic here
    next(error);
  }
};

// @desc    Log in an existing user (RETAILER or ADMIN)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Basic presence check before hitting the database
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required',
      });
    }

    // .select('+password') explicitly opts in to the password hash field,
    // overriding the schema-level select: false default
    const user = await User.findOne({ phone }).select('+password');

    // Return 401 for both "user not found" and "wrong password" —
    // a vague message prevents attackers from enumerating valid phone numbers
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
      });
    }

    signTokenAndRespond(user, 200, res);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };

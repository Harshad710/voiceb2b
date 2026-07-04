const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register  — create a new RETAILER account
router.post('/register', register);

// POST /api/auth/login     — authenticate and receive a JWT
router.post('/login', login);

module.exports = router;

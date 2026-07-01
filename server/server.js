const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json());           // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));

// Health check — useful for deployment and load-balancer probes
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'VoiceB2B API is running' });
});

// 404 handler — catches any unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be mounted LAST — after all routes and other middleware
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

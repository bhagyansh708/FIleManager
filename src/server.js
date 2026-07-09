require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const {
  helmetConfig,
  globalLimiter,
  mongoSanitizeConfig,
} = require('./config/security');
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
// Apply Helmet for HTTP headers protection
app.use(helmetConfig);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB sanitization (prevents NoSQL injection)
app.use(mongoSanitizeConfig);

// Global rate limiting
app.use(globalLimiter);

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FileManager API is running.',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found.',
  });
});

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== DATABASE & SERVER ====================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║   FileManager API - Secure Edition    ║
╚═══════════════════════════════════════╝

Server running on: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Database: ${process.env.DB_URI}

Available Endpoints:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/files/search
  GET    /api/files
  GET    /api/files/:id
  POST   /api/files
  DELETE /api/files/:id
  GET    /health
      `);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Helmet middleware for HTTP headers security
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search endpoint rate limiter (stricter)
const searchLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30,
  message: 'Too many search requests, please try again later.',
  skipSuccessfulRequests: false,
});

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// MongoDB sanitization middleware
const mongoSanitizeConfig = mongoSanitize({
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized field: ${key}`);
  },
});

module.exports = {
  helmetConfig,
  globalLimiter,
  searchLimiter,
  authLimiter,
  mongoSanitizeConfig,
};

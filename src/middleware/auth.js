const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Validates JWT token and attaches user information to request
 * Implements Zero-Trust security: every request must have valid authentication
 */
const authenticateUser = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.slice(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user information to request object
    // This ensures all downstream queries are scoped to this user
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // Log actual error details server-side
    console.error(`Authentication Error: ${error.message}`);

    // Return generic error message to client
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = {
  authenticateUser,
};

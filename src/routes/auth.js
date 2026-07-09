const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { authLimiter } = require('../config/security');

const router = express.Router();

/**
 * Register User
 * POST /api/auth/register
 */
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    // Validate input
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  })
);

/**
 * Login User
 * POST /api/auth/login
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Compare passwords
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      console.warn(`Failed password match for user: ${user._id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  })
);

module.exports = router;

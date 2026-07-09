const express = require('express');
const File = require('../models/File');
const { authenticateUser } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { searchLimiter } = require('../config/security');

const router = express.Router();

// Apply authentication to all file routes
router.use(authenticateUser);

/**
 * Search Files
 * GET /api/files/search
 * Query params: file_name (partial match), file_number (exact match)
 * SECURITY: All queries are scoped to req.user.id (Zero-Trust)
 */
router.get(
  '/search',
  searchLimiter,
  asyncHandler(async (req, res) => {
    const { file_name, file_number } = req.query;

    // Validate input - at least one search parameter required
    if (!file_name && !file_number) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one search parameter (file_name or file_number).',
      });
    }

    // Build query with ZERO-TRUST: always include user_id
    const query = { user_id: req.user.id };

    // Add file_name filter (partial match using regex)
    if (file_name) {
      query.file_name = { $regex: file_name, $options: 'i' }; // Case-insensitive
    }

    // Add file_number filter (exact match)
    if (file_number) {
      query.file_number = file_number;
    }

    // Execute search with strict user_id scope
    const files = await File.find(query)
      .select('file_name file_number file_path file_size created_at')
      .limit(100)
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: `Found ${files.length} file(s).`,
      count: files.length,
      data: files,
    });
  })
);

/**
 * Get All Files
 * GET /api/files
 * SECURITY: All queries are scoped to req.user.id (Zero-Trust)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // ZERO-TRUST: Always scope to authenticated user
    const files = await File.find({ user_id: req.user.id })
      .select('file_name file_number file_path file_size created_at')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const totalCount = await File.countDocuments({ user_id: req.user.id });

    res.status(200).json({
      success: true,
      count: files.length,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / limit),
      data: files,
    });
  })
);

/**
 * Get File by ID
 * GET /api/files/:id
 * SECURITY: Verify ownership before returning file
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    // ZERO-TRUST: Verify file belongs to authenticated user
    if (file.user_id.toString() !== req.user.id) {
      console.warn(`IDOR Attempt: User ${req.user.id} tried to access file ${req.params.id}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  })
);

/**
 * Create File
 * POST /api/files
 * SECURITY: Always associate file with authenticated user
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { file_name, file_number, file_path, file_size, mime_type } = req.body;

    // Validate required fields
    if (!file_name || !file_number) {
      return res.status(400).json({
        success: false,
        message: 'Please provide file_name and file_number.',
      });
    }

    // Create file with ZERO-TRUST: attach to authenticated user
    const file = new File({
      file_name,
      file_number,
      file_path,
      file_size: file_size || 0,
      mime_type: mime_type || 'application/octet-stream',
      user_id: req.user.id, // Automatically scope to authenticated user
    });

    await file.save();

    res.status(201).json({
      success: true,
      message: 'File created successfully.',
      data: file,
    });
  })
);

/**
 * Delete File
 * DELETE /api/files/:id
 * SECURITY: Verify ownership before deletion
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      });
    }

    // ZERO-TRUST: Verify file belongs to authenticated user
    if (file.user_id.toString() !== req.user.id) {
      console.warn(`IDOR Attempt: User ${req.user.id} tried to delete file ${req.params.id}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully.',
    });
  })
);

module.exports = router;

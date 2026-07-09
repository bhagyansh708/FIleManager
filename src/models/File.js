const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    file_name: {
      type: String,
      required: [true, 'Please provide a file name'],
      trim: true,
      index: true, // Index for faster searches
    },
    file_number: {
      type: String,
      required: [true, 'Please provide a file number'],
      index: true, // Index for faster searches
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File must be associated with a user'],
      index: true, // Critical index for zero-trust data access
    },
    file_path: {
      type: String,
      trim: true,
    },
    file_size: {
      type: Number,
      default: 0,
    },
    mime_type: {
      type: String,
      default: 'application/octet-stream',
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // Using explicit timestamps
);

// Compound index for efficient user-scoped queries
fileSchema.index({ user_id: 1, file_name: 1 });
fileSchema.index({ user_id: 1, file_number: 1 });

// Pre-save hook to update timestamp
fileSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('File', fileSchema);

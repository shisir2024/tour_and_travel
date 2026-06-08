const mongoose = require('mongoose');

const FailedLoginSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true },
  ipAddress: { type: String, default: 'unknown' },
  userAgent: { type: String, default: '' },
  reason:    { type: String, default: 'Invalid credentials' },
  blocked:   { type: Boolean, default: false },
}, { timestamps: true });

FailedLoginSchema.index({ email: 1 });
FailedLoginSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FailedLogin', FailedLoginSchema);

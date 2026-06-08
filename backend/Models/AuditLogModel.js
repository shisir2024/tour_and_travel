const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action:     { type: String, required: true },           // 'USER_ROLE_CHANGED', 'TOUR_CREATED', etc.
  category:   { type: String, enum: ['user','tour','booking','staff','system','security','content'], default: 'system' },
  performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId:   { type: String, default: null },            // ID of affected entity
  targetType: { type: String, default: null },            // 'User','Tour','Booking', etc.
  details:    { type: String, default: '' },
  ipAddress:  { type: String, default: 'unknown' },
  userAgent:  { type: String, default: '' },
  status:     { type: String, enum: ['success','failed'], default: 'success' },
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ category: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  role:    { type: String, default: null }, // 'staff' = broadcast to all staff
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['booking','cancellation','signup','contact','general'], default: 'general' },
  isRead:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

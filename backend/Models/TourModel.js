const mongoose = require('mongoose');

const TourSchema = new mongoose.Schema({
  tourName:       { type: String, required: true, trim: true },
  destination:    { type: String, required: true },
  description:    { type: String, default: '' },
  duration:       { type: String, required: true },
  price:          { type: Number, required: true, min: 0 },
  startDate:      { type: Date, required: true },
  endDate:        { type: Date, required: true },
  maxCapacity:    { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, required: true, min: 0 },
  assignedGuide:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status:         { type: String, enum: ['active','completed','cancelled'], default: 'active' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Tour', TourSchema);

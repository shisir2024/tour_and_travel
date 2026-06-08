const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  tourId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  bookedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookingDate:    { type: Date, default: Date.now },
  numberOfPeople: { type: Number, required: true, min: 1 },
  totalAmount:    { type: Number, required: true, min: 0 },
  status:         { type: String, enum: ['pending','confirmed','in-progress','completed','cancelled'], default: 'pending' },
  paymentStatus:  { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  source:         { type: String, enum: ['client','staff'], default: 'staff' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);

const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  agencyName:      { type: String, default: 'MyTripAgency' },
  contactEmail:    { type: String, default: '' },
  contactPhone:    { type: String, default: '' },
  whatsappNumber:  { type: String, default: '' },
  address:         { type: String, default: '' },
  currency:        { type: String, default: 'INR' },
  currencySymbol:  { type: String, default: '₹' },
  taxPercentage:   { type: Number, default: 0 },
  bookingPolicy:   { type: String, default: '' },
  cancellationPolicy:{ type: String, default: '' },
  // Content management
  faqContent:      { type: String, default: '' },
  aboutContent:    { type: String, default: '' },
  privacyPolicy:   { type: String, default: '' },
  termsConditions: { type: String, default: '' },
  homeBanner:      { type: String, default: '' },
  announcement:    { type: String, default: '' },
  announcementActive: { type: Boolean, default: false },
  // Single document pattern — only one settings doc
  singleton:       { type: Boolean, default: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);

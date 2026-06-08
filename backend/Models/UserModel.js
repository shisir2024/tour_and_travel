const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true },
  phone:            { type: String, default: "" },
  role:             { type: String, default: 'client' },  // 'admin' | 'staff' | 'client'
  profileImage:     { type: String, default: "" },
  isActive:         { type: Boolean, default: true },
  isBlocked:        { type: Boolean, default: false },
  blockedAt:        { type: Date, default: null },
  lastLogin:        { type: Date, default: null },
  department:       { type: String, default: '' },       // for staff
  responsibilities: { type: String, default: '' },       // for staff
  resetToken:       { type: String, default: null },
  resetTokenExpiry: { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);

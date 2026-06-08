const mongoose = require("mongoose");

const PrivacyConsentSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  userAgent: { type: String, default: "" },
  acceptedAt:{ type: Date,   default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("PrivacyConsent", PrivacyConsentSchema);

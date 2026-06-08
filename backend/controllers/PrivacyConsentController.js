const PrivacyConsent = require("../Models/PrivacyConsentModel");

const saveConsent = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const userAgent = req.headers["user-agent"] || "";
    const consent   = await PrivacyConsent.create({ email, userAgent });
    res.status(201).json({ message: "Privacy policy acceptance recorded", data: consent });
  } catch (error) {
    res.status(500).json({ message: "Error saving consent", error: error.message });
  }
};

module.exports = { saveConsent };

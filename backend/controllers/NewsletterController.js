const Newsletter = require("../Models/NewsletterModel");

const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase();
    const existing = await Newsletter.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: "This email is already subscribed!" });

    await Newsletter.create({ email: normalizedEmail });
    res.status(201).json({ message: "Subscribed successfully! 🎉 Welcome to our newsletter." });
  } catch (error) {
    res.status(500).json({ message: "Error subscribing", error: error.message });
  }
};

const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.status(200).json({ data: subscribers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscribers", error: error.message });
  }
};

module.exports = { subscribe, getAllSubscribers };

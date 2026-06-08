const Notification = require("../Models/NotificationModel");

const getMyNotifications = async (req, res) => {
  try {
    const query = req.user.role === 'staff'
      ? { $or: [{ userId: req.user.id }, { role: 'staff' }] }
      : req.user.role === 'admin'
      ? { $or: [{ userId: req.user.id }, { role: 'admin' }, { role: 'staff' }] }
      : { userId: req.user.id };
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ data: notifications });
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications.", error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const query = req.user.role === 'staff'
      ? { _id: req.params.id, $or: [{ userId: req.user.id }, { role: 'staff' }] }
      : req.user.role === 'admin'
      ? { _id: req.params.id, $or: [{ userId: req.user.id }, { role: 'admin' }, { role: 'staff' }] }
      : { _id: req.params.id, userId: req.user.id };
    const notif = await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found." });
    res.status(200).json({ message: "Marked as read.", data: notif });
  } catch (err) {
    res.status(500).json({ message: "Error marking notification.", error: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const query = req.user.role === 'staff'
      ? { $or: [{ userId: req.user.id }, { role: 'staff' }], isRead: false }
      : req.user.role === 'admin'
      ? { $or: [{ userId: req.user.id }, { role: 'admin' }, { role: 'staff' }], isRead: false }
      : { userId: req.user.id, isRead: false };
    const result = await Notification.updateMany(query, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read.", count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: "Error marking notifications.", error: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const query = req.user.role === 'staff'
      ? { $or: [{ userId: req.user.id }, { role: 'staff' }], isRead: false }
      : { userId: req.user.id, isRead: false };
    const count = await Notification.countDocuments(query);
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching count.", error: err.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllRead, getUnreadCount };

const Tour       = require('../Models/TourModel');
const Customer   = require('../Models/CustomerModel');
const Booking    = require('../Models/BookingModel');
const Contact    = require('../Models/ContactModel');
const Newsletter = require('../Models/NewsletterModel');

const getStaffStats = async (req, res) => {
  try {
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
          totalBookings: { $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          confirmedCount: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } }
        }
      }
    ]);

    const stats = bookingStats[0] || { totalRevenue: 0, totalBookings: 0, pendingCount: 0, confirmedCount: 0 };

    const [
      totalTours, totalCustomers, totalContacts, totalSubscribers,
    ] = await Promise.all([
      Tour.countDocuments(),
      Customer.countDocuments(),
      Contact.countDocuments(),
      Newsletter.countDocuments(),
    ]);

    const recentBookings = await Booking.find()
      .populate('customerId', 'name email')
      .populate('userId', 'name email')
      .populate('tourId', 'tourName destination')
      .sort({ createdAt: -1 }).limit(10);

    const activeTours = await Tour.find({ status: 'active' })
      .populate('assignedGuide', 'name email')
      .sort({ startDate: 1 }).limit(5);

    const recentContacts = await Contact.find().sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      data: {
        totalTours, 
        totalCustomers, 
        totalBookings: stats.totalBookings, 
        pendingBookings: stats.pendingCount,
        confirmedBookings: stats.confirmedCount, 
        totalRevenue: stats.totalRevenue, 
        totalContacts, 
        totalSubscribers,
        recentBookings, activeTours, recentContacts,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats.', error: err.message });
  }
};

module.exports = { getStaffStats };

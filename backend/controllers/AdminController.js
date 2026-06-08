const User           = require('../Models/UserModel');
const Booking        = require('../Models/BookingModel');
const Tour           = require('../Models/TourModel');
const Customer       = require('../Models/CustomerModel');
const Notification   = require('../Models/NotificationModel');
const Contact        = require('../Models/ContactModel');
const Newsletter     = require('../Models/NewsletterModel');
const AuditLog       = require('../Models/AuditLogModel');
const SystemSettings = require('../Models/SystemSettingsModel');
const FailedLogin    = require('../Models/FailedLoginModel');
const bcrypt         = require('bcryptjs');

// ─── Helper ───────────────────────────────────────────────────────────────────
const log = async (action, category, performedBy, req, targetId = null, targetType = null, details = '') => {
  await AuditLog.create({
    action, category, performedBy, targetId, targetType, details,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || '',
  }).catch(() => {});
};

// ─── Executive Overview ───────────────────────────────────────────────────────
const getAdminOverview = async (req, res) => {
  try {
    const now   = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalUsers, staffCount, clientCount, adminCount,
      totalTours, activeTours, completedTours,
      totalCustomers, totalContacts, totalSubscribers,
      bookingAgg, monthlyAgg, lastMonthAgg,
      recentBookings, recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'admin' }),
      Tour.countDocuments(),
      Tour.countDocuments({ status: 'active' }),
      Tour.countDocuments({ status: 'completed' }),
      Customer.countDocuments(),
      Contact.countDocuments(),
      Newsletter.countDocuments(),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: { $cond: [{ $ne: ['$status','cancelled'] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus','paid'] }, '$totalAmount', 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status','pending'] }, 1, 0] } }, confirmed: { $sum: { $cond: [{ $eq: ['$status','confirmed'] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ['$status','cancelled'] }, 1, 0] } } } }]),
      Booking.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, paymentStatus: 'paid' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }]),
      Booking.find().populate('customerId','name').populate('tourId','tourName destination').populate('userId','name').sort({ createdAt: -1 }).limit(8),
      AuditLog.find().populate('performedBy','name role').sort({ createdAt: -1 }).limit(10),
    ]);

    const stats   = bookingAgg[0] || { total:0, revenue:0, pending:0, confirmed:0, cancelled:0 };
    const monthly = monthlyAgg[0] || { revenue:0, count:0 };
    const lastMon = lastMonthAgg[0] || { revenue:0 };
    const growthPct = lastMon.revenue > 0 ? (((monthly.revenue - lastMon.revenue) / lastMon.revenue) * 100).toFixed(1) : 100;

    // Last 6 months revenue trend
    const trendData = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      data: {
        users:    { total: totalUsers, staff: staffCount, clients: clientCount, admins: adminCount },
        tours:    { total: totalTours, active: activeTours, completed: completedTours },
        bookings: { total: stats.total, pending: stats.pending, confirmed: stats.confirmed, cancelled: stats.cancelled },
        revenue:  { total: stats.revenue, monthly: monthly.revenue, lastMonth: lastMon.revenue, growthPct: Number(growthPct) },
        misc:     { totalCustomers, totalContacts, totalSubscribers },
        trendData, recentBookings, recentActivity,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching overview.', error: err.message });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────
const getAllUsersAdmin = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const skip  = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password -resetToken -resetTokenExpiry').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ]);
    res.status(200).json({ data: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users.', error: err.message });
  }
};

const updateUserRoleAdmin = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['admin','staff','client'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await log('USER_ROLE_CHANGED', 'user', req.user.id, req, user._id, 'User', `Role changed to ${role} for ${user.email}`);
    res.status(200).json({ message: 'Role updated.', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role.', error: err.message });
  }
};

const toggleUserActiveAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    await log(user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'user', req.user.id, req, user._id, 'User', user.email);
    res.status(200).json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling status.', error: err.message });
  }
};

const blockUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isBlocked = !user.isBlocked;
    user.blockedAt = user.isBlocked ? new Date() : null;
    await user.save();
    await log(user.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED', 'security', req.user.id, req, user._id, 'User', user.email);
    res.status(200).json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}.`, data: { isBlocked: user.isBlocked } });
  } catch (err) {
    res.status(500).json({ message: 'Error blocking user.', error: err.message });
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Customer.findOneAndDelete({ userId: req.params.id });
    await log('USER_DELETED', 'user', req.user.id, req, req.params.id, 'User', `Deleted user: ${user.email}`);
    res.status(200).json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user.', error: err.message });
  }
};

const resetUserPasswordAdmin = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    const user   = await User.findByIdAndUpdate(req.params.id, { password: hashed, resetToken: null, resetTokenExpiry: null }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await log('USER_PASSWORD_RESET', 'security', req.user.id, req, user._id, 'User', `Password reset for ${user.email}`);
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password.', error: err.message });
  }
};

// ─── Staff Management ─────────────────────────────────────────────────────────
const createStaffAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, department, responsibilities } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required.' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });
    const hashed  = await bcrypt.hash(password, 10);
    const staff   = await User.create({ name, email, password: hashed, phone: phone || '', role: 'staff', department: department || '', responsibilities: responsibilities || '' });
    await log('STAFF_CREATED', 'staff', req.user.id, req, staff._id, 'User', `Staff created: ${email}`);
    res.status(201).json({ message: 'Staff account created.', data: { id: staff._id, name: staff.name, email: staff.email, role: staff.role } });
  } catch (err) {
    res.status(500).json({ message: 'Error creating staff.', error: err.message });
  }
};

const updateStaffAdmin = async (req, res) => {
  try {
    const { department, responsibilities } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { department, responsibilities }, { new: true }).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'Staff not found.' });
    res.status(200).json({ message: 'Staff updated.', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating staff.', error: err.message });
  }
};

const getStaffPerformance = async (req, res) => {
  try {
    const staffList = await User.find({ role: 'staff' }).select('name email department responsibilities lastLogin isActive');
    const performance = await Promise.all(staffList.map(async (s) => {
      const [bookingsHandled, customersManaged, toursAssigned] = await Promise.all([
        Booking.countDocuments({ bookedBy: s._id }),
        Customer.countDocuments({ createdBy: s._id }),
        Tour.countDocuments({ assignedGuide: s._id }),
      ]);
      return { ...s.toObject(), bookingsHandled, customersManaged, toursAssigned };
    }));
    performance.sort((a, b) => b.bookingsHandled - a.bookingsHandled);
    res.status(200).json({ data: performance });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching staff performance.', error: err.message });
  }
};

// ─── Financial Analytics ──────────────────────────────────────────────────────
const getFinancialAnalytics = async (req, res) => {
  try {
    const now   = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [totalAgg, yearAgg, byDestination, byTour, byGuide, refundAgg, pendingAgg, monthlyTrend] = await Promise.all([
      Booking.aggregate([{ $group: { _id: null, totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus','paid'] }, '$totalAmount', 0] } }, totalRefunds: { $sum: { $cond: [{ $eq: ['$paymentStatus','refunded'] }, '$totalAmount', 0] } }, totalPending: { $sum: { $cond: [{ $eq: ['$paymentStatus','pending'] }, '$totalAmount', 0] } }, paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus','paid'] }, 1, 0] } }, totalCount: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { createdAt: { $gte: yearStart }, paymentStatus: 'paid' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $lookup: { from: 'tours', localField: 'tourId', foreignField: '_id', as: 'tour' } }, { $unwind: '$tour' }, { $group: { _id: '$tour.destination', revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } }, { $sort: { revenue: -1 } }, { $limit: 10 }]),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $lookup: { from: 'tours', localField: 'tourId', foreignField: '_id', as: 'tour' } }, { $unwind: '$tour' }, { $group: { _id: { tourId: '$tour._id', tourName: '$tour.tourName' }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } }, { $sort: { revenue: -1 } }, { $limit: 10 }]),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $lookup: { from: 'tours', localField: 'tourId', foreignField: '_id', as: 'tour' } }, { $unwind: '$tour' }, { $match: { 'tour.assignedGuide': { $ne: null } } }, { $lookup: { from: 'users', localField: 'tour.assignedGuide', foreignField: '_id', as: 'guide' } }, { $unwind: '$guide' }, { $group: { _id: { guideId: '$guide._id', guideName: '$guide.name' }, revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } }, { $sort: { revenue: -1 } }]),
      Booking.aggregate([{ $match: { paymentStatus: 'refunded' } }, { $group: { _id: null, totalRefunded: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { paymentStatus: 'pending' } }, { $group: { _id: null, totalPending: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 }]),
    ]);

    const total   = totalAgg[0]   || { totalRevenue:0, totalRefunds:0, totalPending:0, paidCount:0, totalCount:0 };
    const yearly  = yearAgg[0]    || { revenue:0, count:0 };
    const refunds = refundAgg[0]  || { totalRefunded:0, count:0 };
    const pending = pendingAgg[0] || { totalPending:0, count:0 };
    const successRate = total.totalCount > 0 ? ((total.paidCount / total.totalCount) * 100).toFixed(1) : 0;

    res.status(200).json({ data: { total, yearly, refunds, pending, successRate: Number(successRate), byDestination, byTour, byGuide, monthlyTrend } });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching financial data.', error: err.message });
  }
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  try {
    const { category, page = 1, limit = 25 } = req.query;
    const filter = category ? { category } : {};
    const skip   = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('performedBy','name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);
    res.status(200).json({ data: logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit logs.', error: err.message });
  }
};

// ─── System Monitoring ────────────────────────────────────────────────────────
const getSystemStatus = async (req, res) => {
  try {
    const mem   = process.memoryUsage();
    const uptime = process.uptime();
    const socketCount = req.io ? req.io.engine.clientsCount : 0;

    const [dbCollections, recentErrors] = await Promise.all([
      Promise.resolve({ users: await User.countDocuments(), tours: await Tour.countDocuments(), bookings: await Booking.countDocuments(), customers: await Customer.countDocuments() }),
      AuditLog.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.status(200).json({
      data: {
        uptime: Math.floor(uptime),
        memory: { used: Math.round(mem.rss / 1024 / 1024), heap: Math.round(mem.heapUsed / 1024 / 1024), total: Math.round(mem.heapTotal / 1024 / 1024) },
        database: { status: 'connected', collections: dbCollections },
        sockets:  { active: socketCount },
        recentErrors,
        nodeVersion: process.version,
        platform: process.platform,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching system status.', error: err.message });
  }
};

// ─── Notification Broadcast ───────────────────────────────────────────────────
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, target } = req.body; // target: 'all'|'staff'|'client'
    if (!title || !message || !target) return res.status(400).json({ message: 'Title, message and target required.' });

    const roleFilter = target === 'all' ? ['staff','client'] : [target];
    const users = await User.find({ role: { $in: roleFilter }, isActive: true }).select('_id');

    const notifs = users.map(u => ({ userId: u._id, title, message, type: 'general' }));
    await Notification.insertMany(notifs);

    if (req.io) {
      if (target === 'all') {
        req.io.emit('new-notification', { title, message });
      } else {
        req.io.to(target).emit('new-notification', { title, message });
      }
    }

    await log('NOTIFICATION_BROADCAST', 'system', req.user.id, req, null, null, `Sent to ${target}: "${title}"`);
    res.status(200).json({ message: `Notification sent to ${notifs.length} users.` });
  } catch (err) {
    res.status(500).json({ message: 'Error broadcasting notification.', error: err.message });
  }
};

// ─── System Settings ──────────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ singleton: true });
    if (!settings) settings = await SystemSettings.create({ singleton: true });
    res.status(200).json({ data: settings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching settings.', error: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOneAndUpdate({ singleton: true }, req.body, { new: true, upsert: true });
    await log('SETTINGS_UPDATED', 'system', req.user.id, req, null, null, 'System settings updated');
    res.status(200).json({ message: 'Settings saved.', data: settings });
  } catch (err) {
    res.status(500).json({ message: 'Error updating settings.', error: err.message });
  }
};

// ─── Security Center ──────────────────────────────────────────────────────────
const getFailedLogins = async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      FailedLogin.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      FailedLogin.countDocuments()
    ]);
    res.status(200).json({ data: records, total });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching failed logins.', error: err.message });
  }
};

const clearFailedLogins = async (req, res) => {
  try {
    await FailedLogin.deleteMany({});
    res.status(200).json({ message: 'Failed login records cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing records.', error: err.message });
  }
};

// ─── Reports / Export Data ────────────────────────────────────────────────────
const getReportData = async (req, res) => {
  try {
    const { type } = req.params; // 'bookings'|'revenue'|'customers'|'tours'|'staff'
    let data = [];

    if (type === 'bookings') {
      data = await Booking.find().populate('customerId','name email').populate('tourId','tourName destination').populate('userId','name email').populate('bookedBy','name').sort({ createdAt: -1 }).lean();
    } else if (type === 'revenue') {
      data = await Booking.find({ paymentStatus: 'paid' }).populate('tourId','tourName destination').sort({ createdAt: -1 }).lean();
    } else if (type === 'customers') {
      data = await Customer.find().populate('createdBy','name').sort({ createdAt: -1 }).lean();
    } else if (type === 'tours') {
      data = await Tour.find().populate('assignedGuide','name').populate('createdBy','name').sort({ createdAt: -1 }).lean();
    } else if (type === 'staff') {
      const staffList = await User.find({ role: 'staff' }).select('-password -resetToken -resetTokenExpiry').lean();
      data = await Promise.all(staffList.map(async s => ({
        ...s,
        bookingsHandled:   await Booking.countDocuments({ bookedBy: s._id }),
        customersManaged:  await Customer.countDocuments({ createdBy: s._id }),
        toursAssigned:     await Tour.countDocuments({ assignedGuide: s._id }),
      })));
    } else {
      return res.status(400).json({ message: 'Invalid report type.' });
    }

    await log(`REPORT_EXPORTED_${type.toUpperCase()}`, 'system', req.user.id, req, null, null, `${type} report exported`);
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Error generating report.', error: err.message });
  }
};

// ─── Seed Admins ──────────────────────────────────────────────────────────────
const ADMINS = [
  { email: 'adminshisir@gmail.com', password: 'shisir@12345' },
  { email: 'suriyasekar626@gmail.com', password: 'suriya@123' },
];

const seedAdmins = async (req, res) => {
  try {
    const { secret } = req.body;
    if (!secret || secret !== process.env.SEED_SECRET)
      return res.status(403).json({ message: 'Forbidden: invalid seed secret.' });

    const results = [];
    for (const { email, password } of ADMINS) {
      const hashed   = await bcrypt.hash(password, 10);
      const existing = await User.findOne({ email });
      if (existing) {
        existing.role = 'admin'; existing.password = hashed; existing.isActive = true;
        await existing.save();
        results.push(`Promoted: ${email}`);
      } else {
        await User.create({ name: 'Super Admin', email, password: hashed, role: 'admin', isActive: true });
        results.push(`Created: ${email}`);
      }
    }
    res.status(200).json({ message: 'Admins seeded.', results });
  } catch (err) {
    res.status(500).json({ message: 'Error seeding admins.', error: err.message });
  }
};

module.exports = {
  getAdminOverview, getAllUsersAdmin, updateUserRoleAdmin, toggleUserActiveAdmin,
  blockUserAdmin, deleteUserAdmin, resetUserPasswordAdmin,
  createStaffAdmin, updateStaffAdmin, getStaffPerformance,
  getFinancialAnalytics, getAuditLogs, getSystemStatus,
  broadcastNotification, getSettings, updateSettings,
  getFailedLogins, clearFailedLogins, getReportData,
  seedAdmins,
};

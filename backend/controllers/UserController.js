const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../Models/UserModel'); 
const Customer = require('../Models/CustomerModel');
const Notification = require('../Models/NotificationModel');
const FailedLogin  = require('../Models/FailedLoginModel');
const AuditLog     = require('../Models/AuditLogModel');

const JWT_SECRET = process.env.JWT_SECRET || 'mytripagency_secret_2024';

const signupUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });

    const allowedRoles = ['admin', 'staff', 'client'];
    const userRole = allowedRoles.includes(role) ? role : 'client';
    const hashed  = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed, phone: phone || '', role: userRole });

    // Auto-create customer record for client signups
    if (userRole === 'client') {
      await Customer.create({
        name,
        email,
        phone: phone || 'N/A',
        address: '',
        createdBy: newUser._id,
        userId: newUser._id,
      });
      // Notify all staff + admin about new signup
      for (const notifRole of ['staff', 'admin']) {
        await Notification.create({
          role: notifRole,
          title: 'New Client Registered',
          message: `${name} (${email}) just signed up as a client.`,
          type: 'signup',
        });
      }
      if (req.io) {
        req.io.to('staff').emit('new-notification', { title: 'New Client Registered', message: `${name} signed up.` });
        req.io.to('admin').emit('new-notification', { title: 'New Client Registered', message: `${name} signed up.` });
      }
    }

    res.status(201).json({ message: 'Account created successfully.', data: { name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user.', error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    let match = false;
    const isBcryptHash = user.password && user.password.startsWith('$2');
    if (isBcryptHash) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = (password === user.password);
      if (match) {
        const hashed = await bcrypt.hash(password, 10);
        await User.updateOne({ _id: user._id }, { password: hashed });
      }
    }
    if (!match) {
      // Track failed login
      await FailedLogin.create({
        email: user.email,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || '',
        reason: 'Invalid credentials',
      }).catch(() => {});
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked. Contact admin.' });
    if (!user.isActive) return res.status(403).json({ message: 'Your account is inactive. Contact admin.' });

    let role = user.role;
    if (role === 'guide') {
      role = 'staff';
      await User.updateOne({ _id: user._id }, { role: 'staff' });
    }

    // Update lastLogin
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      message: 'Login successful.',
      token,
      data: { id: user._id, name: user.name, email: user.email, phone: user.phone, role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
};

const getGuides = async (req, res) => {
  try {
    const guides = await User.find({ role: 'staff', isActive: true }).select('name email phone');
    res.status(200).json({ data: guides });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching staff members.', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -resetToken -resetTokenExpiry');
    res.status(200).json({ data: users });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users.', error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'staff', 'client'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User role updated.', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating role.', error: err.message });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling user status.', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Customer.findOneAndDelete({ userId: req.params.id });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user.', error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ data: user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile.', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { new: true }).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Also update Customer record to keep them synchronized
    await Customer.findOneAndUpdate({ userId: req.user.id }, { name, phone });

    res.status(200).json({ message: 'Profile updated.', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile.', error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });
    const crypto = require('crypto');
    const token  = crypto.randomBytes(32).toString('hex');
    user.resetToken       = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();
    
    // Note: In production, send this token via an Email service.
    res.status(200).json({ message: 'If an account with that email exists, a reset token has been generated.' });
  } catch (err) {
    res.status(500).json({ message: 'Error processing request.', error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' });
    user.password         = await bcrypt.hash(newPassword, 10);
    user.resetToken       = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error resetting password.', error: err.message });
  }
};

module.exports = { signupUser, loginUser, getGuides, getAllUsers, getProfile, updateProfile, forgotPassword, resetPassword, updateUserRole, toggleUserActive, deleteUser };

const express = require('express');
const Router  = express.Router();
const {
  getAdminOverview, getAllUsersAdmin, updateUserRoleAdmin, toggleUserActiveAdmin,
  blockUserAdmin, deleteUserAdmin, resetUserPasswordAdmin,
  createStaffAdmin, updateStaffAdmin, getStaffPerformance,
  getFinancialAnalytics, getAuditLogs, getSystemStatus,
  broadcastNotification, getSettings, updateSettings,
  getFailedLogins, clearFailedLogins, getReportData,
  seedAdmins,
} = require('../controllers/AdminController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const adminOnly = [verifyToken, authorizeRoles('admin')];

// Seed admins (no auth, secret-key protected — run once)
Router.post('/seed', seedAdmins);

// Executive overview
Router.get('/overview',                  ...adminOnly, getAdminOverview);

// User management
Router.get('/users',                     ...adminOnly, getAllUsersAdmin);
Router.put('/users/:id/role',            ...adminOnly, updateUserRoleAdmin);
Router.put('/users/:id/toggle-active',   ...adminOnly, toggleUserActiveAdmin);
Router.put('/users/:id/block',           ...adminOnly, blockUserAdmin);
Router.delete('/users/:id',              ...adminOnly, deleteUserAdmin);
Router.put('/users/:id/reset-password',  ...adminOnly, resetUserPasswordAdmin);

// Staff management
Router.post('/staff',                    ...adminOnly, createStaffAdmin);
Router.put('/staff/:id',                 ...adminOnly, updateStaffAdmin);
Router.get('/staff/performance',         ...adminOnly, getStaffPerformance);

// Financial analytics
Router.get('/finance',                   ...adminOnly, getFinancialAnalytics);

// Audit logs
Router.get('/audit-logs',                ...adminOnly, getAuditLogs);

// System monitoring
Router.get('/system-status',             ...adminOnly, getSystemStatus);

// Notifications broadcast
Router.post('/notify',                   ...adminOnly, broadcastNotification);

// Settings
Router.get('/settings',                  ...adminOnly, getSettings);
Router.put('/settings',                  ...adminOnly, updateSettings);

// Security
Router.get('/security/failed-logins',    ...adminOnly, getFailedLogins);
Router.delete('/security/failed-logins', ...adminOnly, clearFailedLogins);

// Reports & Export
Router.get('/reports/:type',             ...adminOnly, getReportData);

module.exports = Router;

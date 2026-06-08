const express = require("express");
const Router  = express.Router();
const { getMyNotifications, markAsRead, markAllRead, getUnreadCount } = require("../controllers/NotificationController");
const { verifyToken } = require("../middleware/auth");

Router.get("/my",         verifyToken, getMyNotifications);
Router.get("/unread-count", verifyToken, getUnreadCount);
Router.put("/:id/read",   verifyToken, markAsRead);
Router.put("/read-all",   verifyToken, markAllRead);

module.exports = Router;

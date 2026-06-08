const express = require("express");
const Router  = express.Router();
const { signupUser, loginUser, getGuides, getAllUsers, getProfile, updateProfile, forgotPassword, resetPassword, updateUserRole, toggleUserActive, deleteUser } = require("../controllers/UserController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// Public routes
Router.post("/signup",          signupUser);
Router.post("/login",           loginUser);
Router.post("/forgot-password", forgotPassword);
Router.post("/reset-password",  resetPassword);

// Authenticated profile routes
Router.get("/profile",          verifyToken, getProfile);
Router.put("/profile",          verifyToken, updateProfile);

// Specific named routes BEFORE /:id param routes
Router.get("/all",              verifyToken, authorizeRoles("admin"), getAllUsers);
Router.get("/guides",           verifyToken, authorizeRoles("staff", "admin"), getGuides);

// Admin-only param routes (must come AFTER named routes)
Router.put("/:id/role",          verifyToken, authorizeRoles("admin"), updateUserRole);
Router.put("/:id/toggle-active", verifyToken, authorizeRoles("admin"), toggleUserActive);
Router.delete("/:id",            verifyToken, authorizeRoles("admin"), deleteUser);

module.exports = Router;

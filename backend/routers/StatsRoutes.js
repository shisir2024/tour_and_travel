const express = require("express");
const Router  = express.Router();
const { getStaffStats } = require("../controllers/StatsController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

Router.get("/staff", verifyToken, authorizeRoles("staff", "admin"), getStaffStats);

module.exports = Router;

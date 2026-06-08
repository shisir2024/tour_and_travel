const express = require("express");
const Router  = express.Router();
const { subscribe, getAllSubscribers } = require("../controllers/NewsletterController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

Router.post("/subscribe", subscribe);
Router.get("/",           verifyToken, authorizeRoles("staff", "admin"), getAllSubscribers);

module.exports = Router;

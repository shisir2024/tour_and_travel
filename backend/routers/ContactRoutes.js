const express = require("express");
const Router  = express.Router();
const { createContact, getAllContacts } = require("../controllers/ContactController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

Router.post("/", createContact);
Router.get("/",  verifyToken, authorizeRoles("staff", "admin"), getAllContacts);

module.exports = Router;

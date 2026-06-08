const express = require("express");
const Router  = express.Router();
const { saveConsent } = require("../controllers/PrivacyConsentController");

Router.post("/consent", saveConsent);

module.exports = Router;

const express = require("express");
const Router  = express.Router();
const { createTour, getAllTours, getTourById, updateTour, deleteTour, assignGuide, updateTourStatus } = require("../controllers/TourController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

Router.post("/",                verifyToken, authorizeRoles("staff", "admin"), createTour);
Router.get("/",                 verifyToken, getAllTours);
Router.get("/:id",              verifyToken, getTourById);
Router.put("/:id",              verifyToken, authorizeRoles("staff", "admin"), updateTour);
Router.delete("/:id",           verifyToken, authorizeRoles("staff", "admin"), deleteTour);
Router.put("/:id/assign-guide", verifyToken, authorizeRoles("staff", "admin"), assignGuide);
Router.put("/:id/status",       verifyToken, authorizeRoles("staff", "admin"), updateTourStatus);

module.exports = Router;

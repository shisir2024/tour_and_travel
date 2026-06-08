const express = require("express");
const Router  = express.Router();
const { 
  createBooking, 
  createClientBooking, 
  getAllBookings, 
  getMyBookings, 
  getBookingById, 
  updateBookingStatus, 
  cancelBooking,
  simulatePayment,
  updatePaymentStatus
} = require("../controllers/BookingController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// Staff & Admin booking endpoints
Router.post("/",                 verifyToken, authorizeRoles("staff", "admin"), createBooking);
Router.get("/",                  verifyToken, authorizeRoles("staff", "admin"), getAllBookings);
Router.get("/:id",               verifyToken, authorizeRoles("staff", "admin"), getBookingById);
Router.put("/:id/status",        verifyToken, authorizeRoles("staff", "admin"), updateBookingStatus);
Router.put("/:id/payment-status",verifyToken, authorizeRoles("staff", "admin"), updatePaymentStatus);
Router.delete("/:id",            verifyToken, authorizeRoles("staff", "admin"), cancelBooking);

// Client booking endpoints
Router.post("/client",           verifyToken, authorizeRoles("client"), createClientBooking);
Router.get("/client/mine",       verifyToken, authorizeRoles("client"), getMyBookings);
Router.put("/client/:id/cancel", verifyToken, authorizeRoles("client"), cancelBooking);
Router.put("/client/:id/pay",    verifyToken, authorizeRoles("client"), simulatePayment);

module.exports = Router;

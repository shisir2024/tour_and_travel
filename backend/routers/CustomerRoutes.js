const express = require("express");
const Router  = express.Router();
const { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer } = require("../controllers/CustomerController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

Router.post("/",      verifyToken, authorizeRoles("staff", "admin"), createCustomer);
Router.get("/",       verifyToken, authorizeRoles("staff", "admin"), getAllCustomers);
Router.get("/:id",    verifyToken, authorizeRoles("staff", "admin"), getCustomerById);
Router.put("/:id",    verifyToken, authorizeRoles("staff", "admin"), updateCustomer);
Router.delete("/:id", verifyToken, authorizeRoles("staff", "admin"), deleteCustomer);

module.exports = Router;

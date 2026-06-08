const Customer = require("../Models/CustomerModel");
const User = require("../Models/UserModel");

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ message: "Name, email and phone are required." });
    const customer = await Customer.create({ name, email, phone, address: address || "", createdBy: req.user.id });
    res.status(201).json({ message: "Customer added.", data: customer });
  } catch (err) {
    res.status(500).json({ message: "Error creating customer.", error: err.message });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate("createdBy", "name").sort({ createdAt: -1 });
    res.status(200).json({ data: customers });
  } catch (err) {
    res.status(500).json({ message: "Error fetching customers.", error: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("createdBy", "name");
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.status(200).json({ data: customer });
  } catch (err) {
    res.status(500).json({ message: "Error fetching customer.", error: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    
    // Sync User details if linked
    if (customer.userId && (req.body.name || req.body.phone)) {
      await User.findByIdAndUpdate(customer.userId, { name: customer.name, phone: customer.phone });
    }

    res.status(200).json({ message: "Customer updated.", data: customer });
  } catch (err) {
    res.status(500).json({ message: "Error updating customer.", error: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    res.status(200).json({ message: "Customer deleted." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting customer.", error: err.message });
  }
};

module.exports = { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };

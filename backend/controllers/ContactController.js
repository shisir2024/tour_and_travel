const Contact      = require('../Models/ContactModel');
const Notification = require('../Models/NotificationModel');

const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ message: 'All fields are required.' });
    const contact = await Contact.create({ name, email, subject, message });
    // Notify all staff
    await Notification.create({ role: 'staff', title: 'New Contact Message', message: `${name} sent: "${subject}"`, type: 'contact' });
    if (req.io) req.io.to('staff').emit('new-notification', { title: 'New Contact Message', message: `${name}: ${subject}` });
    res.status(201).json({ message: 'Message sent successfully', data: contact });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ data: contacts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

module.exports = { createContact, getAllContacts };

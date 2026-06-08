const Booking      = require('../Models/BookingModel');
const Tour         = require('../Models/TourModel');
const Notification = require('../Models/NotificationModel');
const Customer     = require('../Models/CustomerModel');
const mongoose     = require('mongoose');

// Helper — notify all staff via socket and DB
const notifyStaff = async (io, title, message, type = 'booking') => {
  await Notification.create({ role: 'staff', title, message, type });
  if (io) io.to('staff').emit('new-notification', { title, message });
};

// Staff creates booking
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, tourId, numberOfPeople, bookingDate } = req.body;
    if (!customerId || !tourId || !numberOfPeople)
      return res.status(400).json({ message: 'Customer, tour and number of people are required.' });

    // Atomic update: Reduce seats if there are enough seats available
    const tour = await Tour.findOneAndUpdate(
      { _id: tourId, availableSeats: { $gte: numberOfPeople } },
      { $inc: { availableSeats: -numberOfPeople } },
      { new: true, session }
    );

    if (!tour) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient seats available or tour not found.' });
    }

    const totalAmount = tour.price * numberOfPeople;
    
    // Find associated user for customer to set userId if present
    const customer = await Customer.findById(customerId);
    const userId = customer ? customer.userId : null;

    const [booking] = await Booking.create([{
        customerId, userId, tourId,
        bookedBy: req.user.id,
        bookingDate: bookingDate || Date.now(),
        numberOfPeople, totalAmount,
        status: 'pending', source: 'staff',
      }], { session });

    await session.commitTransaction();

    const populated = await booking.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'userId', select: 'name email' },
      { path: 'tourId', select: 'tourName destination price availableSeats' },
      { path: 'bookedBy', select: 'name' }
    ]);

    if (req.io) req.io.to('staff').emit('booking-created', populated);
    
    if (tour.assignedGuide) {
      await Notification.create({ userId: tour.assignedGuide, title: 'New Booking', message: `New booking for "${tour.tourName}"`, type: 'booking' });
      if (req.io) req.io.to(`user-${tour.assignedGuide}`).emit('new-notification', { title: 'New Booking', message: `New booking for "${tour.tourName}"` });
    }

    res.status(201).json({ message: 'Booking created.', data: populated });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Error creating booking.', error: err.message });
  } finally {
    session.endSession();
  }
};

// Client creates booking directly
const createClientBooking = async (req, res) => {
  try {
    const { tourId, numberOfPeople } = req.body;
    if (!tourId || !numberOfPeople)
      return res.status(400).json({ message: 'Tour and number of people are required.' });

    // Find customer for this user
    let customer = await Customer.findOne({ userId: req.user.id });
    if (!customer) {
      customer = await Customer.findOne({ email: req.user.email });
      if (!customer) {
        customer = await Customer.create({
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || 'N/A',
          address: '',
          createdBy: req.user.id,
          userId: req.user.id,
        });
      } else if (!customer.userId) {
        customer.userId = req.user.id;
        await customer.save();
      }
    }

    // Atomic update: Reduce seats if tour is active and seats are available
    const tour = await Tour.findOneAndUpdate(
      { _id: tourId, status: 'active', availableSeats: { $gte: numberOfPeople } },
      { $inc: { availableSeats: -numberOfPeople } },
      { new: true }
    );

    if (!tour) {
      return res.status(400).json({ message: 'Insufficient seats or tour is not active.' });
    }

    const totalAmount = tour.price * numberOfPeople;
    let booking;
    try {
      booking = await Booking.create({
        userId: req.user.id,
        customerId: customer._id,
        tourId,
        bookedBy: req.user.id,
        bookingDate: Date.now(),
        numberOfPeople, totalAmount,
        status: 'pending', source: 'client',
      });
    } catch (createErr) {
      await Tour.findByIdAndUpdate(tourId, { $inc: { availableSeats: numberOfPeople } });
      throw createErr;
    }

    const populated = await booking.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'tourId', select: 'tourName destination price startDate endDate duration' },
      { path: 'bookedBy', select: 'name' }
    ]);

    // Notify all staff about new client booking
    await notifyStaff(req.io, 'New Client Booking', `New booking for "${tour.tourName}" by ${req.user.name}.`, 'booking');
    if (req.io) req.io.to('staff').emit('booking-created', populated);
    
    // Notify the client in real time
    if (req.io) {
      req.io.to(`user-${req.user.id}`).emit('booking-status-updated', populated);
      req.io.to(`user-${req.user.id}`).emit('new-notification', { title: 'Booking Request Received', message: `Your booking for "${tour.tourName}" is pending confirmation.` });
    }

    // Create client notification in database
    await Notification.create({
      userId: req.user.id,
      title: 'Booking Request Received',
      message: `Your booking for "${tour.tourName}" is pending confirmation.`,
      type: 'booking'
    });

    res.status(201).json({ message: 'Booking created.', data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Error creating booking.', error: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name email phone')
      .populate('userId', 'name email')
      .populate('tourId', 'tourName destination price startDate endDate duration')
      .populate('bookedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: bookings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings.', error: err.message });
  }
};

// Client gets their own bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('tourId', 'tourName destination price startDate endDate duration')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: bookings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings.', error: err.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('userId', 'name email')
      .populate('tourId', 'tourName destination price')
      .populate('bookedBy', 'name');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.status(200).json({ data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching booking.', error: err.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const oldStatus = booking.status;
    booking.status = status;

    // Restore seats if status changed to cancelled
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      await Tour.findByIdAndUpdate(booking.tourId, { $inc: { availableSeats: booking.numberOfPeople } });
    } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
      // Re-activating cancelled booking: check seats atomically
      const tour = await Tour.findOneAndUpdate(
        { _id: booking.tourId, availableSeats: { $gte: booking.numberOfPeople } },
        { $inc: { availableSeats: -booking.numberOfPeople } },
        { new: true }
      );
      
      if (!tour) {
        // If no seats, keep it cancelled and do not save the new status
        return res.status(400).json({ message: 'Insufficient seats to reactivate this booking.' });
      }
    }
    
    await booking.save();

    const populated = await booking.populate([
      { path: 'customerId', select: 'name email phone' },
      { path: 'userId', select: 'name email' },
      { path: 'tourId', select: 'tourName destination price assignedGuide' }
    ]);

    // Notify the client who made the booking
    if (populated.userId) {
      await Notification.create({
        userId: populated.userId._id,
        title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your booking for "${populated.tourId?.tourName}" is now ${status}.`,
        type: status === 'cancelled' ? 'cancellation' : 'booking',
      });

      if (req.io) {
        req.io.to(`user-${populated.userId._id}`).emit('booking-status-updated', populated);
        req.io.to(`user-${populated.userId._id}`).emit('new-notification', {
          title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your booking for "${populated.tourId?.tourName}" is now ${status}.`
        });
      }
    }

    // Notify guide
    if (populated.tourId?.assignedGuide) {
      await Notification.create({
        userId: populated.tourId.assignedGuide,
        title: `Booking Update`,
        message: `Booking for "${populated.tourId.tourName}" is now ${status}.`,
        type: status === 'cancelled' ? 'cancellation' : 'booking',
      });
      if (req.io) req.io.to(`user-${populated.tourId.assignedGuide}`).emit('new-notification', { title: 'Booking Update', message: `Booking status is now ${status}` });
    }

    if (req.io) req.io.to('staff').emit('booking-updated', populated);
    res.status(200).json({ message: 'Status updated.', data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating booking status.', error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tourId', 'tourName destination assignedGuide')
      .populate('userId', 'name email')
      .populate('customerId', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Client ownership check
    if (req.user.role === 'client' && booking.userId?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only cancel your own bookings.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    const oldStatus = booking.status;
    booking.status = 'cancelled';
    await booking.save();

    // Restore seats
    if (booking.tourId) {
      await Tour.findByIdAndUpdate(booking.tourId._id, { $inc: { availableSeats: booking.numberOfPeople } });
    }

    // Notifications
    const clientName = booking.userId?.name || booking.customerId?.name || 'Client';
    
    // Notify Staff
    await notifyStaff(req.io, 'Booking Cancelled', `Booking for "${booking.tourId?.tourName}" was cancelled by ${clientName}.`, 'cancellation');
    
    // Notify Guide
    if (booking.tourId?.assignedGuide) {
      await Notification.create({
        userId: booking.tourId.assignedGuide,
        title: 'Booking Cancelled',
        message: `A booking for "${booking.tourId.tourName}" was cancelled.`,
        type: 'cancellation',
      });
      if (req.io) req.io.to(`user-${booking.tourId.assignedGuide}`).emit('new-notification', { title: 'Booking Cancelled', message: `A booking was cancelled.` });
    }

    // Notify client themselves if cancelled by staff
    if (req.user.role === 'staff' && booking.userId) {
      await Notification.create({
        userId: booking.userId._id,
        title: 'Booking Cancelled By Staff',
        message: `Your booking for "${booking.tourId?.tourName}" has been cancelled.`,
        type: 'cancellation',
      });
      if (req.io) {
        req.io.to(`user-${booking.userId._id}`).emit('booking-status-updated', booking);
        req.io.to(`user-${booking.userId._id}`).emit('new-notification', { title: 'Booking Cancelled By Staff', message: `Your booking has been cancelled.` });
      }
    } else if (booking.userId) {
      // client cancelled it themselves, just update dashboard status
      if (req.io) req.io.to(`user-${booking.userId._id}`).emit('booking-status-updated', booking);
    }

    if (req.io) req.io.to('staff').emit('booking-updated', booking);
    res.status(200).json({ message: 'Booking cancelled.', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling booking.', error: err.message });
  }
};

// Simulated check-out dummy endpoint
const simulatePayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body; // 'paid' or 'failed'
    const allowed = ['paid', 'failed'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status.' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('tourId', 'tourName destination price')
      .populate('userId', 'name email');
      
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.userId?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only pay for your own bookings.' });
    }

    booking.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      booking.status = 'confirmed';
    }
    await booking.save();

    const clientName = booking.userId?.name || 'Client';

    // Notify Staff
    await notifyStaff(
      req.io,
      'Payment Received',
      `Payment of ₹${booking.totalAmount} received for "${booking.tourId?.tourName}" by ${clientName}.`,
      'booking'
    );

    // Notify Client
    await Notification.create({
      userId: req.user.id,
      title: 'Payment Successful',
      message: `Your payment of ₹${booking.totalAmount} was processed successfully. Booking confirmed!`,
      type: 'booking'
    });

    if (req.io) {
      req.io.to('staff').emit('booking-updated', booking);
      req.io.to(`user-${req.user.id}`).emit('booking-status-updated', booking);
      req.io.to(`user-${req.user.id}`).emit('new-notification', { title: 'Payment Successful', message: 'Booking is now confirmed!' });
    }

    res.status(200).json({ message: `Payment processed: ${paymentStatus}`, data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Error simulating payment.', error: err.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const allowed = ['pending', 'paid', 'failed', 'refunded'];
    if (!allowed.includes(paymentStatus)) return res.status(400).json({ message: 'Invalid status.' });

    const booking = await Booking.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true })
      .populate('userId', 'name email')
      .populate('customerId', 'name email')
      .populate('tourId', 'tourName destination');

    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.userId && req.io) {
      req.io.to(`user-${booking.userId._id}`).emit('booking-status-updated', booking);
      req.io.to(`user-${booking.userId._id}`).emit('new-notification', {
        title: `Payment status updated`,
        message: `Your payment status for "${booking.tourId?.tourName}" is now ${paymentStatus}.`
      });
      await Notification.create({
        userId: booking.userId._id,
        title: 'Payment Status Update',
        message: `Your payment status for "${booking.tourId?.tourName}" is now ${paymentStatus}.`,
        type: 'booking'
      });
    }

    if (req.io) req.io.to('staff').emit('booking-updated', booking);
    res.status(200).json({ message: 'Payment status updated.', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Error updating payment status.', error: err.message });
  }
};

module.exports = {
  createBooking,
  createClientBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  simulatePayment,
  updatePaymentStatus
};

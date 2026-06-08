const Tour         = require('../Models/TourModel');
const Notification = require('../Models/NotificationModel');

const createTour = async (req, res) => {
  try {
    const { tourName, destination, description, duration, price, startDate, endDate, maxCapacity } = req.body;
    if (!tourName || !destination || !duration || !price || !startDate || !endDate || !maxCapacity)
      return res.status(400).json({ message: 'All required fields must be filled.' });
    const tour = await Tour.create({
      tourName, destination, description, duration, price, startDate, endDate,
      maxCapacity, availableSeats: maxCapacity, createdBy: req.user.id,
    });
    const populated = await tour.populate('createdBy', 'name email');
    // Notify clients of new tour
    if (req.io) req.io.to('client').emit('tours-updated', { action: 'created', tour: populated });
    res.status(201).json({ message: 'Tour created successfully.', data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Error creating tour.', error: err.message });
  }
};

const getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find()
      .populate('assignedGuide', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: tours });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tours.', error: err.message });
  }
};

// Public — for client booking form (no auth required)
const getPublicTours = async (req, res) => {
  try {
    const tours = await Tour.find({ status: 'active', availableSeats: { $gt: 0 } })
      .select('tourName destination description duration price startDate endDate availableSeats maxCapacity')
      .sort({ startDate: 1 });
    res.status(200).json({ data: tours });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tours.', error: err.message });
  }
};

const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate('assignedGuide', 'name email phone')
      .populate('createdBy', 'name');
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    res.status(200).json({ data: tour });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tour.', error: err.message });
  }
};

const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedGuide', 'name email')
      .populate('createdBy', 'name');
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    if (req.io) req.io.to('client').emit('tours-updated', { action: 'updated', tour });
    res.status(200).json({ message: 'Tour updated.', data: tour });
  } catch (err) {
    res.status(500).json({ message: 'Error updating tour.', error: err.message });
  }
};

const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    if (req.io) req.io.to('client').emit('tours-updated', { action: 'deleted', tourId: req.params.id });
    res.status(200).json({ message: 'Tour deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting tour.', error: err.message });
  }
};

const assignGuide = async (req, res) => {
  try {
    const { guideId } = req.body;
    const tour = await Tour.findByIdAndUpdate(req.params.id, { assignedGuide: guideId }, { new: true })
      .populate('assignedGuide', 'name email')
      .populate('createdBy', 'name');
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    if (guideId) {
      await Notification.create({
        userId: guideId, title: 'New Tour Assigned',
        message: `You have been assigned to "${tour.tourName}" (${tour.destination})`, type: 'general',
      });
      if (req.io) req.io.to('staff').emit('new-notification', { title: 'Tour Assigned', message: tour.tourName });
    }
    res.status(200).json({ message: 'Guide assigned successfully.', data: tour });
  } catch (err) {
    res.status(500).json({ message: 'Error assigning guide.', error: err.message });
  }
};

const updateTourStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });
    const tour = await Tour.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('assignedGuide', 'name email');
    if (!tour) return res.status(404).json({ message: 'Tour not found.' });
    if (req.io) req.io.to('client').emit('tours-updated', { action: 'updated', tour });
    res.status(200).json({ message: 'Tour status updated.', data: tour });
  } catch (err) {
    res.status(500).json({ message: 'Error updating tour status.', error: err.message });
  }
};

const getMyTours = async (req, res) => {
  try {
    const tours = await Tour.find({ assignedGuide: req.user.id }).populate('createdBy', 'name').sort({ startDate: 1 });
    res.status(200).json({ data: tours });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assigned tours.', error: err.message });
  }
};

module.exports = { createTour, getAllTours, getPublicTours, getTourById, updateTour, deleteTour, assignGuide, updateTourStatus, getMyTours };

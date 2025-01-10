// controllers/bookingController.js
const Booking = require("../models/Booking");
const Field = require("../models/Field");

// Create a Booking
const createBooking = async (req, res) => {
  try {
    const { fieldId, bookingDate, startTime, endTime, totalAmount } = req.body;

    // Ensure the field exists
    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ message: "Field not found" });

    // Create the booking
    const booking = await Booking.create({
      field: fieldId,
      user: req.user.id,
      bookingDate,
      startTime,
      endTime,
      totalAmount,
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Booking creation failed", error: error.message });
  }
};

// Get All Bookings (Admin Only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("field", "name location")
      .populate("user", "email role");

    res.status(200).json({ bookings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve bookings", error: error.message });
  }
};

// Get User Bookings
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate(
      "field",
      "name location"
    );

    res.status(200).json({ bookings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve bookings", error: error.message });
  }
};

// Update Booking Status (Admin Only)
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking updated", booking });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update booking", error: error.message });
  }
};

// Delete Booking
const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete booking", error: error.message });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getUserBookings,
  updateBookingStatus,
  deleteBooking,
};

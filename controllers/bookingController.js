 
const Booking = require("../models/Booking");
const Field = require("../models/Field");
const Slot = require("../models/Slot");
 
const createBooking = async (req, res) => {
  try {
    const { fieldId, bookingDate, startTime, endTime } = req.body;

    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ message: "Field not found" });

    const slot = await Slot.findOne({ startTime, endTime });
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const slotId = slot._id;
    const bookExist = await Booking.findOne({ field: fieldId, slot: slotId, bookingDate, startTime, endTime });
    if (bookExist) return res.status(400).json({ message: "Slot already booked" });

    const booking = await Booking.create({
      field: fieldId,
      user: req.user.id,
      slot: slotId,
      bookingDate,
      startTime,
      endTime,
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking creation failed", error: error.message });
  }
};

 
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
const slotcreate = async (req, res) => {

  try {
    const {  startTime, endTime } = req.body;
    const slot = await Slot.create({
      startTime,
      endTime,
    });
    res.status(201).json({ message: "New Slot created successfully", slot });

  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating slot", error: error.message });
  }
};

    
const getAvailableSlots = async (req, res) => {
  try{
   // const { fieldId, date } = req.body; 
   // const slots = await Slot.find({field: fieldId, date: date, isBooked: false});

    const slots = await Slot.find();
    res.status(200).json({slots});

  }catch(error){
    res.status(500).json({message: "Failed to retrieve slots", error: error.message});
  }
}

 
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


 
const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) 
      return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete booking", error: error.message });
  }
};

module.exports = {
  createBooking,
  slotcreate,
  getAllBookings,
  getUserBookings,
  getAvailableSlots,
  updateBookingStatus,
  deleteBooking,
};

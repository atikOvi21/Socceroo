// models/booking.js
const { parse, differenceInMinutes } = require("date-fns");
const mongoose = require("mongoose");
const Field = require("./Field");
const Slot = require("./Slot");

if (!Field) {
  console.log("Field is not defined");
}

const bookingSchema = new mongoose.Schema({
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Field",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  slot: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Slot",
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Booking", bookingSchema);

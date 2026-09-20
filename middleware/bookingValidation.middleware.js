const mongoose = require("mongoose");

const validateBooking = (req, res, next) => {
  const { fieldId, bookingDate, startTime, endTime } = req.body;
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!fieldId || !bookingDate || !startTime || !endTime) {
    return res.status(400).json({
      message: "fieldId, bookingDate, startTime and endTime are required",
    });
  }

  if (!mongoose.isValidObjectId(fieldId)) {
    return res.status(400).json({ message: "fieldId is invalid" });
  }

  if (typeof bookingDate !== "string" || !datePattern.test(bookingDate)) {
    return res.status(400).json({
      message: "bookingDate must use YYYY-MM-DD format",
    });
  }

  const normalizedBookingDate = new Date(`${bookingDate}T00:00:00.000Z`);

  if (
    Number.isNaN(normalizedBookingDate.getTime()) ||
    normalizedBookingDate.toISOString().slice(0, 10) !== bookingDate
  ) {
    return res.status(400).json({ message: "bookingDate is invalid" });
  }

  if (
    typeof startTime !== "string" ||
    typeof endTime !== "string" ||
    !timePattern.test(startTime) ||
    !timePattern.test(endTime)
  ) {
    return res.status(400).json({
      message: "startTime and endTime must use HH:mm format",
    });
  }

  if (startTime >= endTime) {
    return res.status(400).json({
      message: "startTime must be earlier than endTime",
    });
  }

  req.body.bookingDate = normalizedBookingDate;
  next();
};

module.exports = validateBooking;

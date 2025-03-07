const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("Slot", slotSchema);

const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  
 {
    fieldName: {
      type: String,
      required: [true, "Field name is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    slotPrice: {
      type: Number,
      
    },
    facilities: {
      type: [String],
      default: [],
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    images: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  
       
    },
  },
  {
    timestamps: true,  
  }
);


module.exports=mongoose.model("Field",fieldSchema);


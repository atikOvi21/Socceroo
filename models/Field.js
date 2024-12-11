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
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
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


/*
{
  "_id": "64a8f6cd94fda83107cb2c4e",
  "name": "City Sports Arena",
  "location": "Downtown",
  "pricePerHour": 50,
  "facilities": ["Lights", "Restroom", "Water Facility"],
  "bookings": ["64a8f6de94fda83107cb2c50"],
  "owner": "64a8f6ee94fda83107cb2c55",
  "createdAt": "2024-11-19T12:34:56.789Z",
  "updatedAt": "2024-11-19T12:34:56.789Z",
  "__v": 0
}
*/

// {
//   "fieldName": "Dhaka Sports",
//   "location": "Dhaka",
//   "pricePerHour": 1000,
//   "facilities": ["Lights", "Restroom"],
//   "bookings": [],
//   "owner": ""
// }
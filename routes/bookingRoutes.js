// routes/bookingRoutes.js
const express = require("express");
const isAuth  = require("../middleware/auth.middleware");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

// User Routes
router.post(
  "/",
  isAuth,
  bookingController.createBooking
);
router.get(
  "/my",
  isAuth,
  bookingController.getUserBookings
);
router.get(
  "/slots",
  bookingController.getAvailableSlots
);


router.post(
  "/slotcreate",
  bookingController.slotcreate
);
router.post("/book-field", isAuth, bookingController.createBooking);

router.get(
  "/",
  isAuth,
  bookingController.getAllBookings
);
// router.put(
//   "/:bookingId",
//   isAuth,
//   bookingController.updateBookingStatus
// );
router.delete(
  "/:bookingId",
  isAuth,
  bookingController.deleteBooking
);

module.exports = router;

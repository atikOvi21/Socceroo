const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const Booking = require("../models/Booking");

const validateReportPeriod = (month, year) => {
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (
    !Number.isInteger(parsedMonth) ||
    parsedMonth < 1 ||
    parsedMonth > 12 ||
    !Number.isInteger(parsedYear) ||
    parsedYear < 2000 ||
    parsedYear > 9999
  ) {
    const error = new Error("Month must be 1-12 and year must be valid");
    error.statusCode = 400;
    throw error;
  }

  return { parsedMonth, parsedYear };
};

async function generateReportData(month, year) {
  const { parsedMonth, parsedYear } = validateReportPeriod(month, year);
  const startOfMonth = moment
    .utc({ year: parsedYear, month: parsedMonth - 1 })
    .startOf("month");
  const startOfNextMonth = startOfMonth.clone().add(1, "month");

  const bookings = await Booking.find({
    bookingDate: {
      $gte: startOfMonth.toDate(),
      $lt: startOfNextMonth.toDate(),
    },
  }).populate("field slot");

  const validBookings = bookings.filter(
    (booking) => booking.field && booking.bookingDate,
  );
  const monthlyProfit = validBookings.reduce(
    (total, booking) => total + (Number(booking.field.slotPrice) || 0),
    0,
  );
  const fieldBookings = new Map();
  const slotBookings = new Map();

  validBookings.forEach((booking) => {
    const fieldId = booking.field._id.toString();
    const fieldEntry = fieldBookings.get(fieldId) || {
      name: booking.field.fieldName,
      bookings: 0,
    };
    fieldEntry.bookings += 1;
    fieldBookings.set(fieldId, fieldEntry);

    const slotTime = `${booking.startTime}-${booking.endTime}`;
    slotBookings.set(slotTime, (slotBookings.get(slotTime) || 0) + 1);
  });

  const weeklyProfits = [];
  let currentWeekStart = startOfMonth.clone();

  while (currentWeekStart.isBefore(startOfNextMonth)) {
    const naturalWeekEnd = currentWeekStart.clone().endOf("week");
    const currentWeekEnd = moment.min(
      naturalWeekEnd,
      startOfNextMonth.clone().subtract(1, "day").endOf("day"),
    );
    const profit = validBookings.reduce((total, booking) => {
      const bookingDate = moment.utc(booking.bookingDate);
      if (
        bookingDate.isBetween(
          currentWeekStart,
          currentWeekEnd,
          undefined,
          "[]",
        )
      ) {
        return total + (Number(booking.field.slotPrice) || 0);
      }
      return total;
    }, 0);

    weeklyProfits.push({
      weekStart: currentWeekStart.format("YYYY-MM-DD"),
      weekEnd: currentWeekEnd.format("YYYY-MM-DD"),
      profit,
    });
    currentWeekStart = currentWeekEnd.clone().add(1, "day").startOf("day");
  }

  const topField = [...fieldBookings.values()].reduce(
    (top, field) => (!top || field.bookings > top.bookings ? field : top),
    null,
  );
  const topSlotEntry = [...slotBookings.entries()].reduce(
    (top, entry) => (!top || entry[1] > top[1] ? entry : top),
    null,
  );

  return {
    month: startOfMonth.format("MMMM YYYY"),
    bookingCount: validBookings.length,
    monthlyProfit,
    averageRevenuePerBooking:
      validBookings.length > 0 ? monthlyProfit / validBookings.length : 0,
    weeklyProfits,
    topField,
    topSlotTime: topSlotEntry ? topSlotEntry[0] : "No data available",
  };
}

async function exportReportToPDF(reportData, month, year) {
  const reportsDir = path.join(__dirname, "..", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const filePath = path.join(
    reportsDir,
    `report_${Number(month)}_${Number(year)}.pdf`,
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    stream.once("finish", () => resolve(filePath));
    stream.once("error", reject);
    doc.once("error", reject);
    doc.pipe(stream);

    doc.fontSize(18).text("Monthly Booking Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Month: ${reportData.month}`);
    doc.text(`Booking Count: ${reportData.bookingCount}`);
    doc.text(`Total Revenue: $${reportData.monthlyProfit.toFixed(2)}`);
    doc.text(
      `Average Revenue per Booking: $${reportData.averageRevenuePerBooking.toFixed(2)}`,
    );
    doc.moveDown();
    doc.fontSize(14).text("Weekly Revenue");
    doc.fontSize(12);
    reportData.weeklyProfits.forEach((week) => {
      doc.text(
        `${week.weekStart} to ${week.weekEnd}: $${week.profit.toFixed(2)}`,
      );
    });
    doc.moveDown();
    doc.text(
      reportData.topField
        ? `Top Booked Field: ${reportData.topField.name} (${reportData.topField.bookings} bookings)`
        : "Top Booked Field: No bookings available",
    );
    doc.text(`Top Booked Slot Time: ${reportData.topSlotTime}`);
    doc.end();
  });
}

module.exports = { generateReportData, exportReportToPDF };

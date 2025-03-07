const PDFDocument = require("pdfkit");
const fs = require("fs");
const moment = require("moment");
const Booking = require("../models/Booking");
const Field = require("../models/Field");

// async function generateReportData(month, year) {
//   try {
     
//     const parsedYear = Number(year);
//     const parsedMonth = Number(month);
//     if (isNaN(parsedYear) || isNaN(parsedMonth)) {
//       throw new Error("Invalid year or month provided");
//     }
    
     
//     const startOfMonth = moment().year(parsedYear).month(parsedMonth - 1).startOf("month");
//     const endOfMonth = moment().year(parsedYear).month(parsedMonth - 1).endOf("month");
    
//      if (!startOfMonth.isValid() || !endOfMonth.isValid()) {
//       throw new Error("Invalid date range generated");
//     }

//     // Optionally, set the week boundaries (these are based on the current week)
//     const startOfWeek = moment().startOf("week");
//     const endOfWeek = moment().endOf("week");

//     // Query bookings within the month using the valid Date objects
//     const bookings = await Booking.find({
//       bookingDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
//     }).populate("field slot");

//     let monthlyProfit = 0;
//     let weeklyProfit = 0;
//     let fieldBookingsCount = {};
//     let slotBookingsCount = {};

//     bookings.forEach((booking) => {
//       // Skip bookings without a valid field or bookingDate
//       if (!booking.field || !booking.bookingDate) return;
      
//       const slotPrice = booking.field.slotPrice || 0;
//       monthlyProfit += slotPrice;

//       // Calculate weekly profit using the week boundaries
//       if (moment(booking.bookingDate).isBetween(startOfWeek, endOfWeek, null, "[]")) {
//         weeklyProfit += slotPrice;
//       }

//       const fieldId = booking.field._id.toString();
//       fieldBookingsCount[fieldId] = (fieldBookingsCount[fieldId] || 0) + 1;

//       const slotTime = `${booking.startTime}-${booking.endTime}`;
//       slotBookingsCount[slotTime] = (slotBookingsCount[slotTime] || 0) + 1;
//     });

//     // Determine the top booked field by count
//     const topFieldId = Object.keys(fieldBookingsCount).reduce((a, b) =>
//       fieldBookingsCount[a] > fieldBookingsCount[b] ? a : b,
//       null
//     );
//     const topField = topFieldId ? await Field.findById(topFieldId) : null;

//     // Determine the most booked slot time
//     const topSlotTime = Object.keys(slotBookingsCount).reduce((a, b) =>
//       slotBookingsCount[a] > slotBookingsCount[b] ? a : b,
//       null
//     );

//     return {
//       month: startOfMonth.format("MMMM YYYY"),
//       monthlyProfit,
//       weeklyProfit,
//       topField: topField
//         ? { name: topField.fieldName, bookings: fieldBookingsCount[topFieldId] }
//         : null,
//       topSlotTime: topSlotTime || "No data available",
//     };
//   } catch (error) {
//     console.error("Error generating report data:", error);
//     throw new Error("Failed to generate report data");
//   }
// }
async function generateReportData(month, year) {
    try {
      const parsedYear = Number(year);
      const parsedMonth = Number(month);
      if (isNaN(parsedYear) || isNaN(parsedMonth)) {
        throw new Error("Invalid year or month provided");
      }
  
      // Create start and end of month using moment.js
      const startOfMonth = moment().year(parsedYear).month(parsedMonth - 1).startOf("month");
      const endOfMonth = moment().year(parsedYear).month(parsedMonth - 1).endOf("month");
  
      // Validate the generated dates
      if (!startOfMonth.isValid() || !endOfMonth.isValid()) {
        throw new Error("Invalid date range generated");
      }
  
      // Query bookings within the month using the valid Date objects
      const bookings = await Booking.find({
        bookingDate: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
      }).populate("field slot");
  
      let monthlyProfit = 0;
      let fieldBookingsCount = {};
      let slotBookingsCount = {};
      let weeklyProfits = [];
  
      // Iterate through each week of the month
      let currentWeekStart = startOfMonth.clone().startOf("week");
      while (currentWeekStart.isBefore(endOfMonth)) {
        let currentWeekEnd = currentWeekStart.clone().endOf("week");
        if (currentWeekEnd.isAfter(endOfMonth)) {
          currentWeekEnd = endOfMonth.clone();
        }
  
        let weeklyProfit = 0;
        bookings.forEach((booking) => {
          // Skip bookings without a valid field or bookingDate
          if (!booking.field || !booking.bookingDate) return;
  
          const slotPrice = booking.field.slotPrice || 0;
          monthlyProfit += slotPrice;
  
          // Calculate weekly profit using the week boundaries
          if (moment(booking.bookingDate).isBetween(currentWeekStart, currentWeekEnd, null, "[]")) {
            weeklyProfit += slotPrice;
          }
  
          const fieldId = booking.field._id.toString();
          fieldBookingsCount[fieldId] = (fieldBookingsCount[fieldId] || 0) + 1;
  
          const slotTime = `${booking.startTime}-${booking.endTime}`;
          slotBookingsCount[slotTime] = (slotBookingsCount[slotTime] || 0) + 1;
        });
  
        weeklyProfits.push({
          weekStart: currentWeekStart.format("YYYY-MM-DD"),
          weekEnd: currentWeekEnd.format("YYYY-MM-DD"),
          profit: weeklyProfit,
        });
  
        currentWeekStart.add(1, "week");
      }
  
      // Determine the top booked field by count
      const topFieldId = Object.keys(fieldBookingsCount).reduce((a, b) =>
        fieldBookingsCount[a] > fieldBookingsCount[b] ? a : b,
        null
      );
      const topField = topFieldId ? await Field.findById(topFieldId) : null;
  
      // Determine the most booked slot time
      const topSlotTime = Object.keys(slotBookingsCount).reduce((a, b) =>
        slotBookingsCount[a] > slotBookingsCount[b] ? a : b,
        null
      );
  
      return {
        month: startOfMonth.format("MMMM YYYY"),
        monthlyProfit,
        weeklyProfits,
        topField: topField
          ? { name: topField.fieldName, bookings: fieldBookingsCount[topFieldId] }
          : null,
        topSlotTime: topSlotTime || "No data available",
      };
    } catch (error) {
      console.error("Error generating report data:", error);
      throw new Error("Failed to generate report data");
    }
  }

function exportReportToPDF(reportData, month, year) {
  try {
    const doc = new PDFDocument();
    const filePath = `./reports/report_${month}_${year}.pdf`;
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text("Monthly Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Month: ${reportData.month}`);
    doc.text(`Total Profit: $${reportData.monthlyProfit}`);
    doc.text(`Weekly Profit: $${reportData.weeklyProfit}`);

    if (reportData.topField) {
      doc.text(
        `Top Booked Field: ${reportData.topField.name} (${reportData.topField.bookings} bookings)`
      );
    } else {
      doc.text("Top Booked Field: No bookings available");
    }

    doc.text(`Top Booked Slot Time: ${reportData.topSlotTime}`);
    doc.end();

    return filePath;
  } catch (error) {
    console.error("Error exporting report to PDF:", error);
    throw new Error("Failed to export report to PDF");
  }
}

module.exports = { generateReportData, exportReportToPDF };

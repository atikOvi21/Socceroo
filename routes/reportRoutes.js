const express = require("express");
const router = express.Router();
const {
  generateReportData,
  exportReportToPDF,
} = require("../controllers/reportServiceController");
const isAuth = require("../middleware/auth.middleware");

const sendReportError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 400 ? error.message : "Failed to generate report";
  return res.status(statusCode).json({ message });
};

router.post("/generate", isAuth, async (req, res) => {
  try {
    const { month, year } = req.body;
    const reportData = await generateReportData(month, year);
    res.status(200).json(reportData);
  } catch (error) {
    return sendReportError(res, error);
  }
});

router.get("/download", isAuth, async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required" });
  }

  try {
    const reportData = await generateReportData(month, year);
    const filePath = await exportReportToPDF(reportData, month, year);
    return res.download(filePath);
  } catch (error) {
    return sendReportError(res, error);
  }
});

module.exports = router;

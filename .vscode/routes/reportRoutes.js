const express = require("express");
const router = express.Router();
const { generateReportData, exportReportToPDF } = require("../controllers/reportServiceController");
const isAuth = require("../middleware/auth.middleware");
router.post("/generate", isAuth, async (req, res) => {
    try {
      const { month, year } = req.body;
      const reportData = await generateReportData(month, year);
      res.status(200).json(reportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report data", error: error.message });
    }
  }); 


router.get("/download", async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: "Month and Year are required" });
  }

  try {
    const reportData = await generateReportData(parseInt(month), parseInt(year));
    const filePath = exportReportToPDF(reportData, month, year);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;

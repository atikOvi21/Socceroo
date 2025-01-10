
const Field = require("../models/Field");

 
exports.createField = async (req, res) => {
  try {
    const { name, location, pricePerHour, amenities } = req.body;
    const field = await Field.create({
      name,
      location,
      pricePerHour,
      amenities,
    });
    res.status(201).json({ message: "Field created successfully", field });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating field", error: error.message });
  }
};

 
exports.getFields = async (req, res) => {
  try {
    const fields = await Field.find();
    res.status(200).json({ fields });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching fields", error: error.message });
  }
};

 
exports.getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ message: "Field not found" });
    res.status(200).json({ field });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching field", error: error.message });
  }
};

 
exports.updateField = async (req, res) => {
  try {
    const { name, location, pricePerHour, amenities } = req.body;
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      { name, location, pricePerHour, amenities },
      { new: true, runValidators: true }
    );
    if (!field) return res.status(404).json({ message: "Field not found" });
    res.status(200).json({ message: "Field updated successfully", field });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating field", error: error.message });
  }
};

 
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findByIdAndDelete(req.params.id);
    if (!field) 
        return res.status(404).json({ message: "Field not found" });
    res.status(200).json({ message: "Field deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting field", error: error.message });
  }
};

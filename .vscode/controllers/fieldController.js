const fs = require("fs");
const path = require("path");
const Field = require("../models/Field");

 
exports.createField = async (req, res) => {
  try {
    const { fieldName, location, pricePerHour } = req.body;
    console.log(req.body);
    const field = await Field.create({
      fieldName,
      location,
      pricePerHour,
      
    });
    res.status(201).json({ message: "New Field created successfully", field });
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
    const { fieldName, location, pricePerHour, facilities } = req.body;
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      { fieldName, location, pricePerHour, facilities },
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

// exports.UploadImage = async (req, res) => {
  
//   const uploadDir = path.join(__dirname, "uploads");

//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }

//   const file = req.files?.image;  
//   if (!file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const uploadPath = path.join(uploadDir, file.name);  

//   file.mv(uploadPath, (err) => {
//     if (err) 
//       return res.status(500).json({ message: "Error saving file" });

     
//     const imagePath = `/uploads/${file.name}`;

//     return res.json({
//       message: "File uploaded successfully",
//       imagePath,
//     });
//   });
// };

exports.postImages = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const photo = req.files.map((file) => `/uploads/${file.filename}`);

    const { fieldId } = req.params;
    const field = await Field.findById(fieldId);

    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    field.images.push(...photo);
    await field.save();
    return res.status(201).json({ message: 'Images uploaded successfully', images: field.images });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getImages = async (req, res) => {
  try {
    const fieldId = req.Field.id;
    const field = await field.findById(fieldId);
    const images= field.images;

    res.json({ images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
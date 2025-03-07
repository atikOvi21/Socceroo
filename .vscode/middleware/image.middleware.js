const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload
const uploadPImage = multer({
  storage: storage,
  limits: { fileSize: 20000000 }, // 20MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

module.exports = { uploadPImage };

// const multer = require("multer");
// const { v4: uuidv4 } = require("uuid");
// const path = require("path");

// const fileFilter = (req, file, cb) => {
//   const allowedType = ["image/jpeg", "image/jpg", "image/png"];
//   if (allowedType.includes(file.mimetype)) {
//     cb(null, true);
//   } else cb(null, false);
// };

// const uImage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
//   },
// });

// let uploadPImage = multer({ storage: uImage, fileFilter });
 

 
// module.exports = { uploadPImage };

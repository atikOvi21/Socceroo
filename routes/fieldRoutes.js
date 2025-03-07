const express = require('express');
const router = express.Router();

const { createField, getFields, getFieldById, updateField, deleteField,postImages,getImages } = require('../controllers/fieldController');
const isAuth = require('../middleware/auth.middleware');
const  { uploadPImage }= require('../middleware/image.middleware');

// Routes
router.post('/create', isAuth, createField);  
router.get('/', getFields);             
router.get('/:id', getFieldById);       
router.put('/:id', isAuth, updateField); 
router.delete('/:id', isAuth, deleteField);  

router.post('/:fieldId/upload-images', uploadPImage.array("images", 5), postImages); // Corrected route
router.get("/multiple-images", getImages);


module.exports = router;   
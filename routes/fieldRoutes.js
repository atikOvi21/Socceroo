const express = require('express');
const router = express.Router();

const { createField, getFields, getFieldById, updateField, deleteField } = require('../controllers/fieldController');
const isAuth = require('../middleware/auth.middleware');

// Routes
router.post('/create', isAuth, createField);  
router.get('/', getFields);             
router.get('/:id', getFieldById);       
router.put('/:id', isAuth, updateField); 
router.delete('/:id', isAuth, deleteField);  


module.exports = router; 
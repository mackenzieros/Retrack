const express = require('express');
const router = express.Router();

const contentController = require('../controllers/contentController');

router.post('/autopopcontent', contentController.autoPop);

module.exports = router;
"use strict";

const express = require('express');

const router = express.Router();

const contentController = require('../controllers/contentController');

router.get('/autopopcontent', contentController.autoPop);
module.exports = router;
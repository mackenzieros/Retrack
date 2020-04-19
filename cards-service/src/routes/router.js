const express = require('express');
const router = express.Router();

const scraper = require('../controllers/scraper');

router.post('/autopopcontent', scraper.autoPop);

module.exports = router;
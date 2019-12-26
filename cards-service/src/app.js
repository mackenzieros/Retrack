const express = require('express');
const bodyParser = require('body-parser');

const mainRouter = require('./routes/router');

const app = express();
app.use(bodyParser.json());
app.use('/', mainRouter);

module.exports = app;
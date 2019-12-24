const express = require('express');
const bodyParser = require('body-parser');

const mainRouter = require('./routes/router');

const app = express();
app.use(bodyParser.json());
app.use('/', mainRouter);

app.listen(4000, () => {
    console.log('Listening on port 4000')
});

module.exports = app;
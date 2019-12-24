const express = require('express');
const proxy = require('express-http-proxy');
const app = express();

app.use('/', proxy('https//google.com'));

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
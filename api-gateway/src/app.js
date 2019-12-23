const express = require('express')
const httpProxy = require('express-http-proxy')
const app = express()

const userServiceProxy = httpProxy('https://retrack-api')

module.exports = {
    app
};
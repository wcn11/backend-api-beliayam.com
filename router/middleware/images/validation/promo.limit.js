const multer = require('multer');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

var limits = {
    fileSize: 300000,
    fieldNameSize: 100,
    fieldSize: 1000000,
}

module.exports = limits
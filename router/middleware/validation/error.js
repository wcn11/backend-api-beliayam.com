
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

const fileSizeLimitErrorHandler = (err, req, res, next) => {

    if (err) {
        return res.status(HttpStatus.OK).send(responser.validation(err.message, HttpStatus.OK))
    } else {
        next()
    }
}

module.exports = fileSizeLimitErrorHandler
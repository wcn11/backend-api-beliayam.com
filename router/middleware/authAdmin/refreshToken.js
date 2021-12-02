const jwt = require('jsonwebtoken');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

module.exports = function(req, res, next) {

    if(!req.header('Authorization')) {
        return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Token Required", HttpStatus.BAD_REQUEST))
    }

    // const token = req.header('Authorization').split(" ")[1]

    // if (!token) {
    //     return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Token Invalid", HttpStatus.BAD_REQUEST))
    // }

    jwt.verify(token, process.env.TOKEN_SECRET)

    try {
        jwt.verify(req.body.refreshToken, process.env.REFRESH_TOKEN_SECRET);
        next()
    } catch (err) {
        return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Invalid Token", HttpStatus.BAD_REQUEST))
    }
}
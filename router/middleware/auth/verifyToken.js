const jwt = require('jsonwebtoken');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

module.exports = function(req, res, next) {

    if (!req.header('Authorization')) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))

    const token = req.header('Authorization')

    if (!token) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))

    if (token.split(" ")[0] !== "Bearer") return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Token Type Authorization Mismatch", HttpStatus.UNAUTHORIZED))

    if (!token.split(" ")[1]) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))

    try {

        const verified = jwt.verify(token.split(" ")[1], process.env.TOKEN_SECRET)

        req.user = verified['data']

        next()
    }catch(err) {

        if (err.name === "TokenExpiredError") {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Token Expired", HttpStatus.UNAUTHORIZED))
        } else if (err.name === "JsonWebTokenError") {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Token", HttpStatus.UNAUTHORIZED))
        } else {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error(err.message, HttpStatus.UNAUTHORIZED))
        }
    }
}
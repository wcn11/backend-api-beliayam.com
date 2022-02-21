const jwt = require('jsonwebtoken');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

module.exports = function(req, res, next) {

    if(!req.header('Authorization')) return res.status(403).send("Unauthorized")

    const token = req.header('Authorization').split(" ")[1]

    if(!token) return res.status(403).send('Unauthorized')

    try {
        const verified = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET)
        req.admin = verified.data.admin
        next()
    } catch (err) {

        if (err.name === "TokenExpiredError") {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Token Expired", HttpStatus.UNAUTHORIZED))
        } else if (err.name === "JsonWebTokenError") {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Token", HttpStatus.UNAUTHORIZED))
        } else {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error(err.message, HttpStatus.UNAUTHORIZED))
        }
    }
}
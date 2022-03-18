const jwt = require('jsonwebtoken');
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const redis = require("redis");

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

module.exports = function(req, res, next) {

    if (!req.header('Authorization')) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))

    const token = req.header('Authorization')

    if (!token) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))

    if (token.split(" ")[0] !== "Bearer") return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Type Authorization Mismatch", HttpStatus.FORBIDDEN))

    if (!token.split(" ")[1]) return res.status(HttpStatus.FORBIDDEN).send(responser.error("Unauthorized", HttpStatus.FORBIDDEN))

    try {

        const verified = jwt.verify(token.split(" ")[1], process.env.TOKEN_SECRET)

        req.user = verified['data']

        client.get(`${req.user.user._id}`, async (err, request) => {

            if (!request) {

                return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Session Expired", HttpStatus.UNAUTHORIZED))
            }

            if (!req.user.user.isActive) {

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.NOT_ACCEPTABLE))
            }

            next()

        })

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
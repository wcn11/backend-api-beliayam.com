const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {

    if(!req.header('Authorization')) return res.status(403).send("Unauthorized")

    const token = req.header('Authorization').split(" ")[1]

    if(!token) return res.status(403).send('Unauthorized')

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        req.user = verified['user']
        next()
    }catch(err) {
        res.status(403).send("Invalid Token")
    }
}
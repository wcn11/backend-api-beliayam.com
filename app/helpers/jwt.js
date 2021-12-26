const jwt = require('jsonwebtoken')

const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

exports.sign = (data, audience) => {

    const token = jwt.sign({
        data
    }, process.env.TOKEN_SECRET,
        {
            expiresIn: process.env.TOKEN_TTL,
            audience: `${audience}`
        })

    return token
};

exports.refreshToken = (data, audience) => {

    const refreshToken = jwt.sign({
        data
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_TTL,
        audience: `${audience}`
    })

    return refreshToken
};

exports.setCache = (audience, token, refreshToken) => {

    client.set(`${audience}`, JSON.stringify({
        token,
        refreshToken
    }), 'EX', process.env.REFRESH_TOKEN_TTL);

}

exports.verify = (token, token_secret) => {
    return jwt.verify(token, token_secret)
};

exports.decode = (token) => {
    return jwt.decode(token);
};
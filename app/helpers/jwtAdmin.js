const jwt = require('jsonwebtoken')

const redis = require("@config/redis");

exports.sign = (data, audience) => {

    const token = jwt.sign({
        data
    }, process.env.ADMIN_TOKEN_SECRET,
        {
            expiresIn: process.env.ADMIN_TOKEN_TTL,
            audience: `${audience}`
        })

    return token
};

exports.refreshToken = (data, audience) => {

    const refreshToken = jwt.sign({
        data
    }, process.env.ADMIN_REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.ADMIN_REFRESH_TOKEN_TTL,
        audience: `${audience}`
    })

    return refreshToken
};

exports.setCache = (audience, token, refreshToken) => {

    redis.set(`${audience}`, JSON.stringify({
        token,
        refreshToken
    }), process.env.ADMIN_REFRESH_TOKEN_TTL);

}

exports.verify = (token, token_secret) => {
    return jwt.verify(token, token_secret)
};

exports.decode = (token) => {
    return jwt.decode(token);
};
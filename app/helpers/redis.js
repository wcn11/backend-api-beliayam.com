const redis = require("redis");

exports.client = () => {
    return redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    })
};
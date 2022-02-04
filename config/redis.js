const redis = require("redis");

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})


exports.set = (key, value, expiredTime, flag = 'EX',) => {

    return client.set(key, value, flag, expiredTime);

}

exports.get = (key) => {

    return new Promise((resolve) => {

        client.get(key, async (err, request) => {

            if (err) throw new Error(err);

            resolve(JSON.parse(request));
        })
    })

}

exports.expire = (key, expireTime = 0) => {

    client.expireat(key, expireTime);

}


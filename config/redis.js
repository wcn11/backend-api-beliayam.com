const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})


exports.setCache = (key, value, flag = 'EX', expiredTime) => {

    return client.set(key, JSON.stringify(value), flag, expiredTime);

}

// const redis = require("redis");
// const client = redis.createClient({
//     host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT
// })

// client.config('set', 'notify-keyspace-events', 'KEA');
// client.subscribe('__keyevent@0__:set', 'data');

// client.on('message', function (channel, key) {
//     console.log(`Expired channel: ${channel}`)
//     console.log(`Redis key: ${key}`)
// });

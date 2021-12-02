const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

client.config('set', 'notify-keyspace-events', 'KEA');
client.subscribe('__keyevent@0__:set', 'data');

client.on('message', function (channel, key) {
    console.log(`Expired channel: ${channel}`)
    console.log(`Redis key: ${key}`)
});

        // const data = client.get(`emailOtp.${req.body._id}`, async (err, request) => {
        //     if(err) return err

        //     if (request){
        //         return res.status(200).send({
        //             jobs: JSON.parse(request),
        //             message: "data retrieved from the cache"
        //         });
        //     }else{
        //         console.log('di cache ulang')
        //         client.setex('data', 3, JSON.stringify('Test Redis Dari Cache'));
        //         return res.status(200).send({
        //             jobs: 'Test Redis',
        //             message: "Re-cache data"
        //         });
        //     }
        // })

        // return data
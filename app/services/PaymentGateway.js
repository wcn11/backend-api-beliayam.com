
const axios = require("axios");
const crypto = require('crypto');

const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const PaymentChannel = require('@utility/payment.lists')


const PaymentGateway = class PaymentGateway {

    constructor() {
        // this.getConfig()
    }

    async getHeader() {
        return {
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_APP_KEY,
            secret: process.env.PUSHER_APP_SECRET,
            cluster: process.env.PUSHER_APP_CLUSTER,
            useTLS: process.env.PUSHER_APP_TLS
        };
    }

    async send(url, data, method = 'post') {

        return await axios({
            url: `${process.env.FASPAY_BASE_URL}` + url,
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            data: data
        })
            .then(response => {
                return response.data
            })
            .catch((err) => {
                console.log(err)
                return err;
            });
    }

    async getListOfPaymentChannels() {

        return PaymentChannel

        // return new Promise((resolve) => {

        //     client.get(`paymentChannelList`, async (err, request) => {

        //         if (!request) {

        //             const md5 = crypto.createHash('md5', process.env.SIGNATURE_SECRET)
        //                 .update(process.env.FASPAY_USER_ID + process.env.FASPAY_PASSWORD)
        //                 .digest('hex')

        //             const signature = crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
        //                 .update(md5)
        //                 .digest('hex')

        //             const response = await this.send('/cvr/100001/10',
        //                 {
        //                     "request": "List of Payment Gateway Channel Beliayam.com",
        //                     "merchant_id": process.env.FASPAY_MERCHANT_ID,
        //                     "merchant": process.env.FASPAY_MERCHANT_NAME,
        //                     "signature": signature
        //                 },
        //                 "post"
        //             )

        //             client.set(`paymentChannelList`, JSON.stringify(response), 'EX', 1800);

        //             resolve(response);
        //         }

        //         resolve(JSON.parse(request));
        //     })
        // })
    }

    async postDataTransaction(data) {

        const md5 = crypto.createHash('md5', process.env.SIGNATURE_SECRET)
            .update(process.env.FASPAY_USER_ID + process.env.FASPAY_PASSWORD)
            .digest('hex')

        const signature = crypto.createHash('sha1', process.env.SIGNATURE_SECRET)
            .update(md5)
            .digest('hex')

        const response = await this.send('/cvr/100001/10',
            {
                "request": "List of Payment Gateway Channel Beliayam.com",
                "merchant_id": process.env.FASPAY_MERCHANT_ID,
                "merchant": process.env.FASPAY_MERCHANT_NAME,
                "signature": signature
            },
            "post"
        )
    }

}



module.exports = new PaymentGateway
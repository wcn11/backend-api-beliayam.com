// const Vonage = require('@vonage/server-sdk')

// const vonage = new Vonage({
//     apiKey: process.env.SMS_GATEWAY_API_KEY,
//     apiSecret: process.env.SMS_GATEWAY_API_SECRET
// })

const axios = require('axios')

const SMSGateway = class SMSGateway {
    
    sendSms(data) {
        const to = data.to
        const text = data.text

        axios({
            url: `${process.env.SMS_GATEWAY_URI}?username=${process.env.SMS_GATEWAY_USERNAME
                }&mobile=${to
                }&message=${text}&password=${process.env.SMS_GATEWAY_PASSWORD}`,
            method: "post",
        })
            .then(response => {
                console.log(`SMS sent to: ${to}, with response: ${response}`)
            })
            .catch((err) => {
                console.log(`get error while sending sms: ${err}`)
            });

        // vonage.message.sendSms(from, to, text, (err, responseData) => {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         if (responseData.messages[0]['status'] === "0") {
        //             return "Sms Verifikasi Berhasil Dikirim"
        //         } else {
        //             console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
        //         }
        //     }
        // })
    }

}



module.exports = new SMSGateway
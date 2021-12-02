const Vonage = require('@vonage/server-sdk')

const vonage = new Vonage({
    apiKey: process.env.SMS_GATEWAY_API_KEY,
    apiSecret: process.env.SMS_GATEWAY_API_SECRET
})

const SMSGateway = class SMSGateway {
    
    sendSms(data){
        const from = data.from
        const to = data.to
        const text = data.text

        vonage.message.sendSms(from, to, text, (err, responseData) => {
            if (err) {
                console.log(err);
            } else {
                if (responseData.messages[0]['status'] === "0") {
                    return "Sms Verifikasi Berhasil Dikirim"
                } else {
                    console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                }
            }
        })
    }

}



module.exports = new SMSGateway
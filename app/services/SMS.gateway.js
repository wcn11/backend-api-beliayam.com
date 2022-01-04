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
    }

}

module.exports = new SMSGateway
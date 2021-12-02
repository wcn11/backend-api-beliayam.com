var nodemailer = require('nodemailer');

const SendForgetPassword = class SendForgetPassword {

    constructor() {
        this.setTransport()
    }

    setTransport() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        })
    }

    send(data) {

        let mailOptions = {
            from: process.env.MAIL_FROM,
            to: data.to,
            subject: data.subject,
            text: data.text
        };

        this.transporter.sendMail(mailOptions, (err, info) => {
            if (err) throw err;
            console.log(`Email Forget Password ${data.to} sent: ` + info.response);
        });
    }
}

module.exports = new SendForgetPassword

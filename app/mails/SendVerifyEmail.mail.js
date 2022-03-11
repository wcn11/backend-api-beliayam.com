var nodemailer = require('nodemailer');
const hbs = require("nodemailer-express-handlebars");
var fs = require('fs');
// const email = require('../../view/template/email/sendOtpEmail.hbs')

const SendVerifyEmail = class SendVerifyEmail {

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

    send(data) {var fs = require('fs');

        this.transporter.use(
            "compile",
            hbs({
                viewEngine: {
                    extname: '.hbs', // handlebars extension
                    layoutsDir: 'views/email/', // location of handlebars templates
                    defaultLayout: 'sendOtpEmail', // name of main template
                },
                viewPath: 'views/email',
                extName: '.hbs',
            })
        )
        let mailOptions = {
            from: process.env.MAIL_FROM,
            to: data.to,
            subject: data.subject,
            template: "sendOtpEmail",
            context: {         
                host: process.env.BASE_URL, // for production, use CLIENT_URL instead,
                name: data.name,
                otp: data.otp
            }
        };

        this.transporter.sendMail(mailOptions, (err, info) => {
            if (err) throw err;
            console.log(`Email Verify ${data.to} sent: ` + info.response);
        });
    }
}

module.exports = new SendVerifyEmail

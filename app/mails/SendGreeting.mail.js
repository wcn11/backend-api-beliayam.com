var nodemailer = require('nodemailer');
const hbs = require("nodemailer-express-handlebars");
var fs = require('fs');

const SendGreeting = class SendGreeting {

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
        var fs = require('fs');

        this.transporter.use(
            "compile",
            hbs({
                viewEngine: {
                    extname: '.hbs', // handlebars extension
                    layoutsDir: 'views/email/', // location of handlebars templates
                    defaultLayout: 'greetingAfterRegister', // name of main template
                },
                viewPath: 'views/email',
                extName: '.hbs',
            })
        )
        let mailOptions = {
            from: process.env.MAIL_FROM,
            to: data.to,
            subject: data.subject,
            template: "greetingAfterRegister",
            context: {
                host: process.env.BASE_URL, // for production, use CLIENT_URL instead,
                name: data.name,
                text: data.text
            }
        };

        this.transporter.sendMail(mailOptions, (err, info) => {
            if (err) throw err;
            console.log(`Email Greeting ${data.to} sent: ` + info.response);
        });
    }
}

module.exports = new SendGreeting

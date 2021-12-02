const Pusher = require("pusher");

const PushNotification = class PushNotification {

    constructor(){
        this.getConfig()
    }

    async getConfig(){
        return {
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_APP_KEY,
            secret: process.env.PUSHER_APP_SECRET,
            cluster: process.env.PUSHER_APP_CLUSTER,
            useTLS: process.env.PUSHER_APP_TLS
        };
    }

    async send() {
        const pusher = new Pusher(await this.getConfig());

        await pusher.trigger("my-channel", "my-event", {
            message: "hello test"
        });
    }

}



module.exports = new PushNotification
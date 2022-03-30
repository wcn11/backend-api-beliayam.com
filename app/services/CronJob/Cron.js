

const cron = require('node-cron');
const CancelPayment = require('@service/CancelPaymentExpired')

const CronJob = class CronJob {

    CancelPaymentExpired() {

        cron.schedule('10 * * * * *', function () {
            CancelPayment.cancel()
        }).start();
    }
}

module.exports = new CronJob
const moment = require('moment')
moment.locale('id-ID');

exports.currentTime = () => {
    return moment().add(7, 'hour').toDate()
};
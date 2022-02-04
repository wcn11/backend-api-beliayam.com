const moment = require('moment')
moment.locale('id-ID');

exports.time = (value = 7, time = 'hour') => {
    return moment().add(value, time)
};

exports.format = (value, format = "YYYY-MM-DD HH:mm:ss") => {
    return moment(value) //.format(format)
};

exports.beginOf = (startOf = 'day') => {
    return moment().startOf(startOf).toString()
};

exports.endOf = (endOf = 'day') => {
    return moment().endOf(endOf).toString()
};

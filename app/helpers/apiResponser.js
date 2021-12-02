
const HttpStatus = require('@helper/http_status')

exports.success = (data, message = "OK", statusCode = 200) => {
    return {
        message,
        error: false,
        code: statusCode,
        data
    };
};

exports.error = (message, statusCode = 404) => {

    return {
        message,
        error: true,
        code: statusCode
    };
};

exports.validation = (message, statusCode = 400) => {
    return {
        message: message,
        error: true,
        code: statusCode
    };
};
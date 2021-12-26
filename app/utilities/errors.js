class GeneralError extends Error {
    constructor(message, error, statusCode) {
        super();
        this.message = message;
        this.error = error;
        this.code = statusCode

    }

    getCode() {
        if (this instanceof BadRequest) {
            return this.code;
        } if (this instanceof NotFound) {
            return this.code;
        }
        return 500;
    }
}

class BadRequest extends GeneralError { }
class NotFound extends GeneralError { }

module.exports = {
    GeneralError,
    BadRequest,
    NotFound
};
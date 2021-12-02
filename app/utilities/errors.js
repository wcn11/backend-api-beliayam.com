class GeneralError extends Error {
    constructor(message, error) {
        super();
        this.message = message;
        this.success = error;

    }

    getCode() {
        if (this instanceof BadRequest) {
            return this.error;
        } if (this instanceof NotFound) {
            return this.error;
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
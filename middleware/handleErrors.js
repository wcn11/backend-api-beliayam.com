const { GeneralError } = require('@utility/errors');

const responser = require('@responser')

const handleErrors = (err, req, res, next) => {
    if (err instanceof GeneralError) {
        
        return res.status(err.code).send(responser.validation(err.message, err.code))

    }

    const error_code = err.code ? err.code : 500

    return res.status(error_code).send(responser.validation(err.message, error_code))
}


module.exports = handleErrors;
const { GeneralError } = require('@utility/errors');


const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

const handleErrors = (err, req, res, next) => {
    if (err instanceof GeneralError) {
        
        return res.status(401).send(responser.validation(err.message, err.code))

    }
    
    return res.status(500).send(responser.validation(err.message,500))
}


module.exports = handleErrors;
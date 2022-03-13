const Joi = require('joi');

const getOrderByIdValidation = (data) => {

    const schema = Joi.object({
        order_id: Joi.string().required(),
    })

    return schema.validate(data)
}

const cancelOrderValidation = (data) => {

    const schema = Joi.object({
        order_id: Joi.string().required(),
    })

    return schema.validate(data)
}

module.exports = {
    getOrderByIdValidation,
    cancelOrderValidation
}
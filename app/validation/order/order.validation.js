const Joi = require('joi');

const placeOrderValidation = (data) => {

    const schema = Joi.object({
        shipping_address: Joi.string().required(),
        user_id: Joi.string().required(),
        vouchers: Joi.array(),
        payment: {
            pg_code: Joi.number().required(),
            // pg_name: Joi.string().required(),
            type: Joi.string().required(),
        },
        type: Joi.string().valid('order'),
        platform: Joi.string().valid('website', 'mobile'),
        isActive: Joi.boolean()
    })

    return schema.validate(data)
}

const getOrderByIdValidation = (data) => {

    const schema = Joi.object({
        order_id: Joi.string().required(),
    })

    return schema.validate(data)
}

const cancelOrderValidation = (data) => {

    const schema = Joi.object({
        trx_id: Joi.string().required(),
        bill_no: Joi.string().required(),
        order_id: Joi.string().required(),
    })

    return schema.validate(data)
}

module.exports = {
    placeOrderValidation,
    getOrderByIdValidation,
    cancelOrderValidation
}
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

const completeOrderValidation = (data) => {

    const schema = Joi.object({
        order_id: Joi.string().required(),
    })

    return schema.validate(data)
}

const setDeliveryOrderStatusValidation = (data) => {

    const schema = Joi.object({
        order_id: Joi.string().required(),
        delivery: Joi.object({
            isDelivery: Joi.boolean().required(),
            deliveryDate: Joi.date().allow(null, ""),
            // user_id: Joi.string().required()
        }),
    })

    return schema.validate(data)
}

module.exports = {
    getOrderByIdValidation,
    cancelOrderValidation,
    completeOrderValidation,
    setDeliveryOrderStatusValidation
}
const Joi = require('joi');

const calculateCheckoutValidation = (data) => {

    const schema = Joi.object({
        cart: Joi.object({
            cart_id: Joi.string().required(),
            products: Joi.array().items(Joi.object().keys({
                _id: Joi.string().required(),
                sku: Joi.string().required(),
                name: Joi.string().required(),
                price: Joi.number().required(),
                image: Joi.string(),
                additional: Joi.string(),
                description: Joi.string(),
                quantity: Joi.number().required(),
            }))
        }),
        user_id: Joi.string().required(),
        vouchers: Joi.array()
    })

    return schema.validate(data)
}

const applyVoucherValidation = (data) => {

    const schema = Joi.object({
        voucherCode: Joi.string().required(),
        cart_id: Joi.string().required(),
        user_id: Joi.string().required(),
        platform: Joi.string().valid('all', 'website', 'mobile'),
    })

    return schema.validate(data)
}

module.exports = {
    calculateCheckoutValidation,
    applyVoucherValidation
}
const Joi = require('joi');

const calculateCheckoutValidation = (data) => {

    const schema = Joi.object({
        cart: Joi.object({
            cart_id: Joi.string().required(),
            products: Joi.array()
        }),
        user_id: Joi.string().required(),
        vouchers: Joi.array(),
        type: Joi.string().valid('checkout'),
        platform: Joi.string().valid('all', 'website', 'mobile'),
        isActive: Joi.boolean()
    })

    return schema.validate(data)
}

const applyVoucherValidation = (data) => {

    const schema = Joi.object({
        voucherCode: Joi.string().required(),
        user_id: Joi.string().required(),
        platform: Joi.string().valid('all', 'website', 'mobile'),
    })

    return schema.validate(data)
}

const removeVoucherValidation = (data) => {

    const schema = Joi.object({
        voucher_id: Joi.string().required(),
        user_id: Joi.string().required()
    })

    return schema.validate(data)
}

module.exports = {
    calculateCheckoutValidation,
    applyVoucherValidation,
    removeVoucherValidation
}
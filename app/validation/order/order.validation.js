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

// const applyVoucherValidation = (data) => {

//     const schema = Joi.object({
//         voucherCode: Joi.string().required(),
//         user_id: Joi.string().required(),
//         platform: Joi.string().valid('all', 'website', 'mobile'),
//     })

//     return schema.validate(data)
// }

// const removeVoucherValidation = (data) => {

//     const schema = Joi.object({
//         voucher_id: Joi.string().required(),
//         user_id: Joi.string().required()
//     })

//     return schema.validate(data)
// }

module.exports = {
    placeOrderValidation,
    // applyVoucherValidation,
    // removeVoucherValidation
}
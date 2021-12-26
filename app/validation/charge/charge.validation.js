const Joi = require('joi');

const createNewChargeValidation = (data) => {
    const schema = Joi.object({
        chargeName: Joi.string().min(3).required(),
        chargeBy: Joi.string().valid('price').required(),
        chargeValue: Joi.number(),
        shortDescription: Joi.string().min(10).max(100).required(),
        description: Joi.string().min(10).max(500).required(),
        default: Joi.string().default('checkout'),
        private: Joi.boolean(),
        users: Joi.string(),
        termsAndConditions: Joi.string().max(500),
        isActive: Joi.boolean(),
        plaform: Joi.string().valid('all', 'website', "mobile").default('all')
    })

    return schema.validate(data)
}

const getAllChargesValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('chargeName').required()
    })

    return schema.validate(data)
}

const updateChargeByChargeIdValidation = (data) => {
    const schema = Joi.object({
        chargeName: Joi.string().min(3).required(),
        chargeBy: Joi.string().valid('percent', 'price').required(),
        chargeValue: Joi.number(),
        shortDescription: Joi.string().min(10).max(100).required(),
        description: Joi.string().min(10).max(500).required(),
        default: Joi.string().default('checkout'),
        private: Joi.boolean(),
        users: Joi.string(),
        termsAndConditions: Joi.string().max(500),
        isActive: Joi.boolean(),
        plaform: Joi.string().valid('all', 'website', "mobile").default('all')
    })

    return schema.validate(data)
}

const getChargeByChargeIdValidation = (data) => {
    const schema = Joi.object({
        chargeId: Joi.string().required(),
    })

    return schema.validate(data)
}

const deleteChargeByChargeIdValidation = (data) => {
    const schema = Joi.object({
        chargeId: Joi.string().required(),
    })

    return schema.validate(data)
}

// const updateVoucherByVoucherIdValidation = (data) => {
//     const schema = Joi.object({
//         voucherCode: Joi.string().min(3).required(),
//         banner: Joi.any(),
//         discountBy: Joi.string().valid('percent', 'price').required(),
//         discountValue: Joi.number(),
//         minimumOrderValue: Joi.number(),
//         private: Joi.boolean(),
//         maxUser: Joi.number().max(10).default(0),
//         user_id: Joi.string(),
//         max: Joi.number().max(10),
//         termsAndConditions: Joi.string().max(500),
//         discountStart: Joi.date().required(),
//         disocuntEnd: Joi.date().required(),
//         isActive: Joi.bool(),
//         description: Joi.string().max(500),
//         plaform: Joi.string().valid('all', 'website', 'mobile'),
//     })

//     return schema.validate(data)
// }

module.exports = {
    createNewChargeValidation,
    getAllChargesValidation,
    updateChargeByChargeIdValidation,
    getChargeByChargeIdValidation,
    deleteChargeByChargeIdValidation,
    // deleteVoucherByVoucherIdValidation
}
const Joi = require('joi');

const createNewPromoValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        tags: Joi.string().min(2).max(10),
        products: Joi.array().required(),
        banner: Joi.any(),
        termsAndConditions: Joi.string().max(1024),
        promoValue: Joi.number().min(1).required(),
        promoBy: Joi.string().valid('percent', 'price'),
        promoStart: Joi.date().required(),
        promoEnd: Joi.date().required(),
        isActive: Joi.bool(),
        description: Joi.string().max(500),
        platform: Joi.array()
            .items(Joi.string().valid('all', 'website', 'mobile'))  // only allow(valid) 'Hindi' or 'English' items in array

    })

    return schema.validate(data)
}

const getAllPromoValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('id', 'name').required(),
        platform: Joi.array()
            .items(Joi.string().valid('all', 'website', 'mobile')),
        isActive: Joi.boolean()
    })

    return schema.validate(data)
}
const getAllPromoProductValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('id', 'name').required(),
        platform: Joi.array()
            .items(Joi.string().valid('all', 'website', 'mobile')),
        isActive: Joi.boolean()
    })

    return schema.validate(data)
}

const getPromoByPromoIdValidation = (data) => {
    const schema = Joi.object({
        promoId: Joi.string().required(),
    })

    return schema.validate(data)
}

const updatePromoByPromoIdValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3),
        tags: Joi.string().min(2).max(10),
        products: Joi.array(),
        banner: Joi.any(),
        termsAndConditions: Joi.string().max(1024),
        promoStart: Joi.date(),
        promoEnd: Joi.date(),
        isActive: Joi.bool(),
        description: Joi.string().max(500),
        platform: Joi.array()
            .items(Joi.string().valid('all', 'website', 'mobile'))  // only allow(valid) 'Hindi' or 'English' items in array

    })

    return schema.validate(data)
}

const updateStatusByPromoIdValidation = (data) => {
    const schema = Joi.object({
        isActive: Joi.bool().required(),
    })

    return schema.validate(data)
}

const deletePromoByPromoIdValidation = (data) => {
    const schema = Joi.object({
        promoId: Joi.string().required(),
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
//         discountEnd: Joi.date().required(),
//         isActive: Joi.bool(),
//         description: Joi.string().max(500),
//         plaform: Joi.string().valid('all', 'website', 'mobile'),
//     })

//     return schema.validate(data)
// }

module.exports = {
    createNewPromoValidation,
    getAllPromoValidation,
    getPromoByPromoIdValidation,
    updatePromoByPromoIdValidation,
    deletePromoByPromoIdValidation,
    getAllPromoProductValidation,
    updateStatusByPromoIdValidation
}
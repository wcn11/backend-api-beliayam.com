const Joi = require('joi');

const createNewVoucherValidation = (data) => {
    const schema = Joi.object({
        voucherName: Joi.string().min(3).required(),
        voucherCode: Joi.string().min(3).required(),
        banner: Joi.any(),
        discountBy: Joi.string().valid('percent', 'price').required(),
        discountValue: Joi.number(),
        minimumOrderValue: Joi.number(),
        private: Joi.boolean(),
        maxUser: Joi.number().max(10).default(0),
        user_id: Joi.array(),
        max: Joi.number().max(10),
        termsAndConditions: Joi.string().max(500),
        discountStart: Joi.date().required(),
        discountEnd: Joi.date().required(),
        isActive: Joi.bool(),
        description: Joi.string().max(500)
    })

    return schema.validate(data)
}

const getAllVouchersValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('voucherCode').required()
    })

    return schema.validate(data)
}

const getAllVouchersByUserValidation = (data) => {
    const schema = Joi.object({
        // user_id: Joi.string().required(),
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('voucherCode').required(),
        platform: Joi.string().valid('all', 'website', 'mobile'),
        isActive: Joi.bool(),
    })

    return schema.validate(data)
}

const getVoucherByVoucherCodeValidation = (data) => {
    const schema = Joi.object({
        voucherCode: Joi.string().required(),
    })

    return schema.validate(data)
}

const getVoucherByVoucherIdValidation = (data) => {
    const schema = Joi.object({
        voucherId: Joi.string().required(),
    })

    return schema.validate(data)
}

const deleteVoucherByVoucherIdValidation = (data) => {
    const schema = Joi.object({
        voucherId: Joi.string().required(),
    })

    return schema.validate(data)
}

const updateVoucherByVoucherIdValidation = (data) => {
    const schema = Joi.object({
        voucherName: Joi.string().min(3).required(),
        voucherCode: Joi.string().min(3).required(),
        banner: Joi.any(),
        discountBy: Joi.string().valid('percent', 'price').required(),
        discountValue: Joi.number(),
        minimumOrderValue: Joi.number(),
        private: Joi.boolean(),
        maxUser: Joi.number().max(10).default(0),
        user_id: Joi.array(),
        max: Joi.number().max(10),
        termsAndConditions: Joi.string().max(500),
        discountStart: Joi.date().required(),
        discountEnd: Joi.date().required(),
        isActive: Joi.bool(),
        description: Joi.string().max(500),
        // platform: Joi.string().valid('all', 'website', 'mobile'),
    })

    return schema.validate(data)
}

// const deleteProductAtCartByProductIdValidation = (data) => {
//     const schema = Joi.object({
//         user_id: Joi.string().max(255).required(),
//         product_id: Joi.string().max(255).required()
//     })

//     return schema.validate(data)
// }

// const updateProductQuantityByProductIdValidation = (data) => {
//     const schema = Joi.object({
//         user_id: Joi.string().max(255).required(),
//         product_id: Joi.string().max(255).required(),
//         type: Joi.string().min(1).max(10).valid('plus', 'minus', 'multiply').required(),
//         quantity: Joi.number().min(1).required()
//     })

//     return schema.validate(data)
// }


module.exports = {
    createNewVoucherValidation,
    getAllVouchersValidation,
    getAllVouchersByUserValidation,
    getVoucherByVoucherCodeValidation,
    getVoucherByVoucherIdValidation,
    updateVoucherByVoucherIdValidation,
    deleteVoucherByVoucherIdValidation
}
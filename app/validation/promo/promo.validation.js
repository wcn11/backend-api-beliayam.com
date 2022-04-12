const Joi = require('joi');

const createNewPromoValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        slug: Joi.string().required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label('Slug')
            .messages({
                "any.required": `{{#label}} dibutuhkan`,
                "any.regex": "Slug tidak valid"
            }),
        tags: Joi.string().min(2).max(15),
        products: Joi.array(),
        image_promo: Joi.any(),
        termsAndConditions: Joi.string(),
        promoValue: Joi.number().min(1).required(),
        promoBy: Joi.string().valid('percent', 'price'),
        promoStart: Joi.date().required(),
        promoEnd: Joi.date().required(),
        isActive: Joi.bool(),
        description: Joi.string(),
        platform: Joi.string().valid('all', 'website', 'mobile')  // only allow(valid) 'Hindi' or 'English' items in array

    })

    return schema.validate(data)
}

const getAllPromoValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('id', 'name').required(),
        platform: Joi.string().valid('all', 'website', 'mobile'),
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
        platform: Joi.string().valid('all', 'website', 'mobile'),
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
        slug: Joi.string().required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label('Slug')
            .messages({
                "any.required": `{{#label}} dibutuhkan`,
                "any.regex": "Slug tidak valid"
            }),
        tags: Joi.string().min(2).max(15),
        products: Joi.array(),
        image_promo: Joi.any(),
        banner: Joi.any(),
        termsAndConditions: Joi.string(),
        promoValue: Joi.number().min(1).required(),
        promoBy: Joi.string().valid('percent', 'price'),
        promoStart: Joi.date(),
        promoEnd: Joi.date(),
        isActive: Joi.bool(),
        description: Joi.string(),
        platform: Joi.string().valid('all', 'website', 'mobile')  // only allow(valid) 'Hindi' or 'English' items in array

    })

    return schema.validate(data)
}

const addProductToPromoValidation = (data) => {
    const schema = Joi.object({
        product_id: Joi.array()
    })

    return schema.validate(data)
}

const removeProductFromPromoValidation = (data) => {
    const schema = Joi.object({
        product_id: Joi.array()
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

module.exports = {
    createNewPromoValidation,
    getAllPromoValidation,
    getPromoByPromoIdValidation,
    updatePromoByPromoIdValidation,
    deletePromoByPromoIdValidation,
    getAllPromoProductValidation,
    updateStatusByPromoIdValidation,
    addProductToPromoValidation,
    removeProductFromPromoValidation
}
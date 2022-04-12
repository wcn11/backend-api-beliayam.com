const Joi = require('joi');

const addProductValidation = (data) => {
    const schema = Joi.object({
        category_id: Joi.string(),
        sku: Joi.string().min(1).max(20).required(),
        slug: Joi.string().min(1).required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label('Slug')
            .messages({
                "any.required": `{{#label}} dibutuhkan`,
                "any.regex": "Slug tidak valid"
            }),
        name: Joi.string().min(6).max(100).required(),
        position: Joi.number().min(1).max(10),
        image_product: Joi.any(),
        price: Joi.number().min(3),
        weight: Joi.number().min(0.1).required(),
        stock: Joi.number(),
        isDiscount: Joi.boolean(),
        discount: Joi.number().min(1).max(100),
        discountBy: Joi.string().min(1).max(10).valid('percent', 'price'),
        discountStart: Joi.date(),
        discountEnd: Joi.date(),
        priceAfterDiscount: Joi.number(),
        promotion: Joi.number().min(1).max(100),
        isPromotion: Joi.boolean(),
        promotionBy: Joi.string().min(1).max(10).valid('percent', 'price'),
        promotionStart: Joi.date(),
        promotionEnd: Joi.date(),
        priceAfterPromotion: Joi.number(),
        status: Joi.string().min(3).max(50),
        additional: Joi.string().min(3).max(50),
        description: Joi.string(),
    })

    return schema.validate(data)
}

const getProductsValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required(),
        category: Joi.string().max(255)
    })

    return schema.validate(data)
}

const getProductsByKeywordValidation = (data) => {
    const schema = Joi.object({
        keywords: Joi.string(),
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required()
    })

    return schema.validate(data)
}

const getProductsByCategoryIdValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required()
    })

    return schema.validate(data)
}

const getProductBySlugValidation = (data) => {
    const schema = Joi.object({
        slug: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

const getProductByIdValidation = (data) => {
    const schema = Joi.object({
        productId: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

const deleteProductByIdValidation = (data) => {
    const schema = Joi.object({
        productId: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

const updateProductByIdValidation = (data) => {
    const schema = Joi.object({
        category_id: Joi.string().min(1),
        sku: Joi.string().min(1).max(20).required(),
        slug: Joi.string().min(1).required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label('Slug')
            .messages({
                "any.required": `{{#label}} dibutuhkan`,
                "any.regex": "Slug tidak valid"
            }),
        name: Joi.string().min(6).max(100).required(),
        position: Joi.number().min(1).max(10),
        image_product: Joi.any(),
        price: Joi.number(),
        stock: Joi.number(),
        weight: Joi.number().min(0.1).required(),
        isDiscount: Joi.boolean(),
        discount: Joi.number().min(1).max(100),
        discountBy: Joi.string().min(1).max(10).valid('percent', 'price'),
        discountStart: Joi.date(),
        discountEnd: Joi.date(),
        promo: Joi.array(),
        status: Joi.string().min(3).max(50),
        additional: Joi.string().min(3).max(50),
        description: Joi.string(),
    })

    return schema.validate(data)
}


module.exports = {
    addProductValidation,
    getProductsValidation,
    getProductBySlugValidation,
    getProductByIdValidation,
    updateProductByIdValidation,
    deleteProductByIdValidation,
    getProductsByKeywordValidation,
    getProductsByCategoryIdValidation
}
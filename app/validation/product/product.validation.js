const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationMessages = require('@utility/validation/validationMessage')

const addProductValidation = (data) => {
    const schema = Joi.object({
        category_id: Joi.string().label(ValidationLabel.CATEGORY_ID),
        sku: Joi.string().min(1).max(20).required().label(ValidationLabel.SKU),
        slug: Joi.string().min(1).required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label(ValidationLabel.SLUG),
        name: Joi.string().min(6).max(100).required().label(ValidationLabel.NAME),
        position: Joi.number().allow("").min(1).label(ValidationLabel.POSITION),
        image_product: Joi.any().label(ValidationLabel.IMAGE_PRODUCT),
        price: Joi.number().min(3).label(ValidationLabel.PRICE),
        weight: Joi.number().min(0.1).required().label(ValidationLabel.WEIGHT),
        stock: Joi.number().min(3).label(ValidationLabel.STOCK),
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
        additional: Joi.string().allow("").max(50),
        description: Joi.string(),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getProductsValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required(),
        category: Joi.string().max(255)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getProductsByCategoryIdValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required()
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getProductBySlugValidation = (data) => {
    const schema = Joi.object({
        slug: Joi.string().max(255).required()
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getProductByIdValidation = (data) => {
    const schema = Joi.object({
        productId: Joi.string().max(255).required()
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const deleteProductByIdValidation = (data) => {
    const schema = Joi.object({
        productId: Joi.string().max(255).required()
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateProductByIdValidation = (data) => {
    const schema = Joi.object({
        category_id: Joi.string().label(ValidationLabel.CATEGORY_ID),
        sku: Joi.string().min(1).max(20).required().label(ValidationLabel.SKU),
        slug: Joi.string().min(1).required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label(ValidationLabel.SLUG),
        name: Joi.string().min(6).max(100).required().label(ValidationLabel.NAME),
        position: Joi.number().allow("").min(1).label(ValidationLabel.POSITION),
        image_product: Joi.any().label(ValidationLabel.IMAGE_PRODUCT),
        price: Joi.number().min(3).label(ValidationLabel.PRICE),
        weight: Joi.number().min(0.1).required().label(ValidationLabel.WEIGHT),
        stock: Joi.number().min(3).label(ValidationLabel.STOCK),
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
        additional: Joi.string().allow("").max(50),
        description: Joi.string(),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    addProductValidation,
    getProductsValidation,
    getProductBySlugValidation,
    getProductByIdValidation,
    updateProductByIdValidation,
    deleteProductByIdValidation,
    getProductsByCategoryIdValidation
}
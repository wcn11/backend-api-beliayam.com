const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationMessages = require('@utility/validation/validationMessage')

const addCategory = (data) => {
    const schema = Joi.object({
        sku: Joi.string().min(1).max(20).required().label(ValidationLabel.SKU),
        slug: Joi.string().min(1).required().regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/).label(ValidationLabel.SLUG),
        name: Joi.string().min(3).max(100).required().label(ValidationLabel.NAME),
        position: Joi.number().min(1).max(10).label(ValidationLabel.POSITION),
        image_category: Joi.any().label(ValidationLabel.IMAGE_CATEGORY),
        status: Joi.string().min(3).max(50).label(ValidationLabel.STATUS),
        additional: Joi.string().allow("").max(50).label(ValidationLabel.ADDITIONAL),
        description: Joi.string().allow("").label(ValidationLabel.DESCRIPTION),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getAllCategory = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).label(ValidationLabel.PAGE),
        show: Joi.number().min(1).max(100).label(ValidationLabel.SHOW),
        status: Joi.string().min(3).max(50).valid('active', 'inactive').label(ValidationLabel.DESCRIPTION),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').label(ValidationLabel.STATUS),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').label(ValidationLabel.ORDER_BY)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getProductByCategoryIdOrSlugValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).label(ValidationLabel.PAGE),
        show: Joi.number().min(1).max(100).label(ValidationLabel.SHOW),
        status: Joi.string().min(3).max(50).valid('active', 'inactive').label(ValidationLabel.DESCRIPTION),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').label(ValidationLabel.STATUS),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').label(ValidationLabel.ORDER_BY)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const deleteCategoryByCategoryId = (data) => {
    const schema = Joi.object({
        categoryId: Joi.string().max(255).required().label(ValidationLabel.CATEGORY_ID)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getCategoryByCategoryId = (data) => {
    const schema = Joi.object({
        categoryId: Joi.string().max(255).required().label(ValidationLabel.CATEGORY_ID)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    addCategory,
    getAllCategory,
    getCategoryByCategoryId,
    deleteCategoryByCategoryId,
    getProductByCategoryIdOrSlugValidation
}
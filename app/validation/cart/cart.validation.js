const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationMessages = require('@utility/validation/validationMessage')

const addToCartValidation = (data) => {
    const schema = Joi.object({
        product_id: Joi.string().min(1).required().label(ValidationLabel.PRODUCT_ID),
        user_id: Joi.string().min(1).required().label(ValidationLabel.USER_ID),
        quantity: Joi.number().min(1).required().label(ValidationLabel.QUANTITY),
        note: Joi.string().min(0).max(250).label(ValidationLabel.NOTE)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getCartsValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).label(ValidationLabel.PAGE),
        show: Joi.number().min(1).max(100).label(ValidationLabel.SHOW),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').label(ValidationLabel.SORT_BY),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').label(ValidationLabel.ORDER_BY)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const applyVoucherValidation = (data) => {

    const schema = Joi.object({
        voucher_id: Joi.string().required().label(ValidationLabel.VOUCHER_ID),
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        cart_id: Joi.string().required().label(ValidationLabel.CART_ID),
        platform: Joi.string().valid('all', 'website', 'mobile').required().label(ValidationLabel.PLATFORM)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const deleteProductAtCartByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required().label(ValidationLabel.USER_ID),
        product_id: Joi.string().max(255).required().label(ValidationLabel.PRODUCT_ID)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateProductQuantityByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required().label(ValidationLabel.USER_ID),
        product_id: Joi.string().max(255).required().label(ValidationLabel.PRODUCT_ID),
        type: Joi.string().min(1).max(10).valid('plus', 'minus', 'multiply').required().label(ValidationLabel.TYPE),
        quantity: Joi.number().required().label(ValidationLabel.QUANTITY)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateProductNoteByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required().label(ValidationLabel.USER_ID),
        product_id: Joi.string().max(255).required().label(ValidationLabel.PRODUCT_ID),
        note: Joi.string().allow("").max(150).label(ValidationLabel.NOTE),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    getCartsValidation,
    addToCartValidation,
    applyVoucherValidation,
    updateProductNoteByProductIdValidation,
    updateProductQuantityByProductIdValidation,
    deleteProductAtCartByProductIdValidation
}
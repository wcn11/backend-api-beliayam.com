const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationMessages = require('@utility/validation/validationMessage')

const calculateCheckoutValidation = (data) => {

    const schema = Joi.object({
        cart: Joi.object({
            cart_id: Joi.string().required().label(ValidationLabel.CART_ID),
            products: Joi.array().label(ValidationLabel.PRODUCTS)
        }),
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        vouchers: Joi.array().label(ValidationLabel.VOUCHERS),
        type: Joi.string().valid('checkout').label(ValidationLabel.TYPE),
        platform: Joi.string().valid('all', 'website', 'mobile').label(ValidationLabel.PLATFORM),
        isActive: Joi.boolean().label(ValidationLabel.IS_ACTIVE)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const applyVoucherValidation = (data) => {

    const schema = Joi.object({
        voucherCode: Joi.string().required().label(ValidationLabel.VOUCHER_CODE),
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        platform: Joi.string().valid('all', 'website', 'mobile').label(ValidationLabel.PLATFORM),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const removeVoucherValidation = (data) => {

    const schema = Joi.object({
        voucher_id: Joi.string().required().label(ValidationLabel.VOUCHER_ID),
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    calculateCheckoutValidation,
    applyVoucherValidation,
    removeVoucherValidation
}
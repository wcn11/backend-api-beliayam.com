const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationMessages = require('@utility/validation/validationMessage')

const placeOrderValidation = (data) => {

    const schema = Joi.object({
        shipping_address: Joi.string().required().label(ValidationLabel.SHIPPING_ADDRESS),
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        vouchers: Joi.array().label(ValidationLabel.VOUCHERS),
        payment: {
            pg_code: Joi.number().required().label(ValidationLabel.PG_CODE),
            type: Joi.string().required().label(ValidationLabel.TYPE),
        },
        type: Joi.string().valid('order').label(ValidationLabel.TYPE),
        platform: Joi.string().valid('website', 'mobile').label(ValidationLabel.PLATFORM),
        isActive: Joi.boolean().label(ValidationLabel.IS_ACTIVE)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getOrderByIdValidation = (data) => {

    const schema = Joi.object({
        order_id: Joi.string().required().label(ValidationLabel.ORDER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const cancelOrderValidation = (data) => {

    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        order_id: Joi.string().required().label(ValidationLabel.ORDER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const completeOrderValidation = (data) => {

    const schema = Joi.object({
        user_id: Joi.string().required().label(ValidationLabel.USER_ID),
        order_id: Joi.string().required().label(ValidationLabel.ORDER_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    placeOrderValidation,
    getOrderByIdValidation,
    cancelOrderValidation,
    completeOrderValidation
}
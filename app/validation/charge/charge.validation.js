const Joi = require('joi');
const ValidationLabel = require('@utility/validation/validationLabel')
const ValidationMessages = require('@utility/validation/validationMessage')

const createNewChargeValidation = (data) => {
    const schema = Joi.object({
        chargeName: Joi.string().min(3).required().label(ValidationLabel.CHARGE_NAME),
        chargeBy: Joi.string().valid('price').required().label(ValidationLabel.CHARGE_BY),
        chargeValue: Joi.number().label(ValidationLabel.CHARGE_VALUE),
        shortDescription: Joi.string().min(10).max(100).required().label(ValidationLabel.SHORT_DESCRIPTION),
        description: Joi.string().min(10).max(500).required().label(ValidationLabel.DESCRIPTION),
        default: Joi.string().default('checkout').label(ValidationLabel.DEFAULT),
        private: Joi.boolean().label(ValidationLabel.PRIVATE),
        users: Joi.string().label(ValidationLabel.USERS),
        termsAndConditions: Joi.string().max(500).label(ValidationLabel.TERMS_AND_CONDITIONS),
        isActive: Joi.boolean().label(ValidationLabel.IS_ACTIVE),
        platform: Joi.string().valid('all', 'website', 'mobile').label(ValidationLabel.PLATFORM)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getAllChargesValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required().label(ValidationLabel.PAGE),
        show: Joi.number().min(1).max(100).required().label(ValidationLabel.SHOW),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required().label(ValidationLabel.SORT_BY),
        orderBy: Joi.string().min(1).max(10).valid('chargeName').required().label(ValidationLabel.ORDER_BY)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const updateChargeByChargeIdValidation = (data) => {
    const schema = Joi.object({
        chargeName: Joi.string().min(3).required().label(ValidationLabel.CHARGE_NAME),
        chargeBy: Joi.string().valid('price').required().label(ValidationLabel.CHARGE_BY),
        chargeValue: Joi.number().label(ValidationLabel.CHARGE_VALUE),
        shortDescription: Joi.string().min(10).max(100).required().label(ValidationLabel.SHORT_DESCRIPTION),
        description: Joi.string().min(10).max(500).required().label(ValidationLabel.DESCRIPTION),
        default: Joi.string().default('checkout').label(ValidationLabel.DEFAULT),
        private: Joi.boolean().label(ValidationLabel.PRIVATE),
        users: Joi.string().label(ValidationLabel.USERS),
        termsAndConditions: Joi.string().max(500).label(ValidationLabel.TERMS_AND_CONDITIONS),
        isActive: Joi.boolean().label(ValidationLabel.IS_ACTIVE),
        platform: Joi.string().valid('all', 'website', 'mobile').label(ValidationLabel.PLATFORM)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const getChargeByChargeIdValidation = (data) => {
    const schema = Joi.object({
        chargeId: Joi.string().required().label(ValidationLabel.CHARGE_ID),
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

const deleteChargeByChargeIdValidation = (data) => {
    const schema = Joi.object({
        chargeId: Joi.string().required().label(ValidationLabel.CHARGE_ID)
    }).messages(ValidationMessages.messages)

    return schema.validate(data, function (err) {
        if (err) {
            return catched(err.message);
        }
    });
}

module.exports = {
    createNewChargeValidation,
    getAllChargesValidation,
    updateChargeByChargeIdValidation,
    getChargeByChargeIdValidation,
    deleteChargeByChargeIdValidation
}
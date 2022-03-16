const Joi = require('joi');

const addToCartValidation = (data) => {
    const schema = Joi.object({
        product_id: Joi.string().min(1).required(),
        user_id: Joi.string().min(1).required(),
        quantity: Joi.number().min(1).required(),
        note: Joi.string().min(0).max(250)
    })

    return schema.validate(data)
}

const getCartsValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20),
        show: Joi.number().min(1).max(100),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC'),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position')
    })

    return schema.validate(data)
}


const applyVoucherValidation = (data) => {

    const schema = Joi.object({
        voucher_id: Joi.string().required(),
        user_id: Joi.string().required(),
        cart_id: Joi.string().required(),
        platform: Joi.string().valid('all', 'website', 'mobile').required()
    })

    return schema.validate(data)
}

const deleteProductAtCartByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required(),
        product_id: Joi.string().max(255).required()
    })

    return schema.validate(data)
}

const updateProductQuantityByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required(),
        product_id: Joi.string().max(255).required(),
        type: Joi.string().min(1).max(10).valid('plus', 'minus', 'multiply').required(),
        quantity: Joi.number().required()
    })

    return schema.validate(data)
}

const updateProductNoteByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required(),
        product_id: Joi.string().max(255).required(),
        note: Joi.string().allow("").max(150),
    })

    return schema.validate(data)
}


module.exports = {
    getCartsValidation,
    addToCartValidation,
    applyVoucherValidation,
    updateProductNoteByProductIdValidation,
    updateProductQuantityByProductIdValidation,
    deleteProductAtCartByProductIdValidation
}
const Joi = require('joi');

const addToCartValidation = (data) => {
    const schema = Joi.object({
        product_id: Joi.string().min(1).required(),
        user_id: Joi.string().min(1).required(),
        quantity: Joi.number().min(1).required(),
        note: Joi.string().max(250)
    })

    return schema.validate(data)
}

const getCartsValidation = (data) => {
    const schema = Joi.object({
        page: Joi.number().min(1).max(20).required(),
        show: Joi.number().min(1).max(100).required(),
        sortBy: Joi.string().min(1).max(10).valid('ASC', 'DESC').required(),
        orderBy: Joi.string().min(1).max(10).valid('name', 'position').required()
    })

    return schema.validate(data)
}

// const getProductByIdValidation = (data) => {
//     const schema = Joi.object({
//         productId: Joi.string().max(255).required()
//     })

//     return schema.validate(data)
// }

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
        quantity: Joi.number().min(1).required()
    })

    return schema.validate(data)
}

const updateProductNoteByProductIdValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.string().max(255).required(),
        product_id: Joi.string().max(255).required(),
        note: Joi.string().max(150),
    })

    return schema.validate(data)
}


module.exports = {
    getCartsValidation,
    addToCartValidation,
    updateProductNoteByProductIdValidation,
    updateProductQuantityByProductIdValidation,
    deleteProductAtCartByProductIdValidation
}
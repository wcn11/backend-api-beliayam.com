const mongoose = require('mongoose');
const CartModel = require('@model/cart/cart.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')


const {
    getCartsValidation,
    addToCartValidation,
    // getProductsValidation,
    updateProductNoteByProductIdValidation,
    updateProductQuantityByProductIdValidation,
    deleteProductAtCartByProductIdValidation

} = require('@validation/cart/cart.validation')

const CartController = class CartController {

    async getCarts(req, res) {

        const { error } = getCartsValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        // try {

        let page = req.query.page ?? 1
        let show = req.query.show ?? 10

        let sortBy;

        let orderBy;

        if (!req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        }

        orderBy = req.query.orderBy ? `products.${req.query.orderBy}` : 'products.name'

        let cart = await CartModel.findOne({
            "user": {
                "$in": [req.user.user._id]
            },
        }).populate([{ path: 'users' }, {
            path: 'products',
            populate: {
                path: 'productOnLive'
            },
        }])
            .sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

        // if (cart) {
        //     cart.users.otpEmail = undefined
        //     cart.users.otpSms = undefined
        //     cart.users.password = undefined
        // }

        return res.status(HttpStatus.OK).send(responser.success(cart, HttpStatus.OK));

        // } catch (err) {

        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        // }
    }

    async addToCart(req, res) {

        const { error } = addToCartValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isIdValid = this.isIdValid(req.body.product_id)

        if (!isIdValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("ID Produk Tidak Valid", HttpStatus.BAD_REQUEST))
        }

        try {

            let input = req.body

            let product = await this.isProductExist(input.product_id)

            let user = await this.getUserById(req.body.user_id)

            if (!product) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Produk Tidak Ditemukan", HttpStatus.BAD_REQUEST))
            }

            if (!user) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("User Tidak Ditemukan", HttpStatus.BAD_REQUEST))
            }

            if (input.quantity <= 0) {
                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation("Minimal 1 Kuantitas Yang Dapat Ditambahkan", HttpStatus.NOT_ACCEPTABLE))
            }

            if (product.stock <= 0) {
                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation("Stok Tidak Tersedia", HttpStatus.NOT_ACCEPTABLE))
            }

            if (product.stock < input.quantity) {
                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation("Melebihi Stok Tersedia", HttpStatus.NOT_ACCEPTABLE))
            }

            let carts = await CartModel.findOne({
                "user._id": req.body.user_id
            })

            if (carts) {

                let isProductExist = carts.products.filter(product => product.id === req.body.product_id)

                if (isProductExist.length > 0) {

                    if ((isProductExist[0].quantity + input.quantity) > isProductExist[0].stock) {
                        return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Stok barang ini sisa ${product.stock} dan kamu sudah punya ${isProductExist[0].quantity} di keranjangmu.`, HttpStatus.NOT_ACCEPTABLE))
                    }

                    let cartUpdate = await CartModel.updateOne(
                        {
                            "user._id": req.body.user_id,
                            "products._id": isProductExist[0]._id
                        }, {
                        $set: {
                            "products.$.quantity": isProductExist[0].quantity + input.quantity,
                            totalQuantity: carts.totalQuantity + input.quantity,
                            subTotal: carts.subTotal + (product.price * input.quantity),
                            baseTotal: carts.baseTotal + (product.price * input.quantity)
                        }
                    })

                    return res.status(HttpStatus.OK).send(responser.success([], "Produk Ditambahkan Ke Keranjang"))
                }

                if (product.stock < input.quantity) {
                    return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation("Melebihi Stok Tersedia Saat Ini", HttpStatus.NOT_ACCEPTABLE))
                }

                await CartModel.updateOne(
                    {
                        "user._id": req.body.user_id
                    }, {
                    $set: {

                        totalQuantity: carts.totalQuantity + input.quantity,
                        subTotal: carts.subTotal + (product.price * input.quantity),
                        baseTotal: carts.baseTotal + (product.price * input.quantity)
                    },
                    $push: {
                        products: {
                            _id: product._id,
                            slug: product.slug,
                            sku: product.sku,
                            name: product.name,
                            position: product.position,
                            quantity: input.quantity,
                            price: product.price,
                            image: product.image,
                            status: product.status,
                            additional: product.additional,
                            description: product.description,
                            note: input.note ?? "",
                            productOnLive: product._id
                        },
                    }
                }, {
                    $project: {
                        _id: 1
                    }
                })

                return res.status(HttpStatus.OK).send(responser.success([], "Produk Ditambahkan Ke Keranjang"))
            }

            let cartObject = {

                products: {
                    _id: product._id,
                    slug: product.slug,
                    sku: product.sku,
                    name: product.name,
                    position: product.position,
                    quantity: input.quantity,
                    price: product.price,
                    image: product.image ?? "images/product/default.jpg",
                    status: product.status,
                    additional: product.additional,
                    description: product.description,
                    productOnLive: product._id
                },
                user: user['_id'],
                totalQuantity: input.quantity,
                subTotal: product.price * input.quantity,
                baseTotal: product.price * input.quantity
            }

            let cart = new CartModel(cartObject)

            const savedCart = await cart.save()

            return res.status(HttpStatus.OK).send(responser.success(savedCart, "Produk Ditambahkan Ke Keranjang"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Produk", HttpStatus.BAD_REQUEST))

        }
    }

    async deleteProductAtCartByProductId(req, res) {

        const { error } = deleteProductAtCartByProductIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let carts = await CartModel.findOne({
            "user._id": req.body.user_id,
            "product_id": req.body.product_id
        })

        let user = await this.getUserById(req.body.user_id)

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("User Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let product = carts.products.filter(product => product.id === req.body.product_id)

        if (product.length <= 0) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Tidak Ada Dalam Keranjang", HttpStatus.NOT_FOUND))
        }

        try {

            await CartModel.updateOne({
                "user._id": req.body.user_id,
                "products._id": req.body.product_id
            }, {
                $pull: {
                    "products": {
                        _id: req.body.product_id
                    }
                },
                $set: {
                    totalQuantity: carts.totalQuantity - product[0].quantity,
                    subTotal: carts.subTotal - (product[0].price * product[0].quantity),
                    baseTotal: carts.subTotal - (product[0].price * product[0].quantity)
                }
            });

            return res.status(HttpStatus.OK).send(responser.success([], "Produk Dihapus Dari Keranjang"))

        } catch (err) {

            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Tidak Bisa Menghapus Produk", HttpStatus.NOT_MODIFIED))

        }
    }

    async updateProductQuantityByProductId(req, res) {

        const { error } = updateProductQuantityByProductIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let user = await this.getUserById(req.body.user_id)

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("User Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let isProductExist = await this.isProductExist(req.body.product_id)

        if (!isProductExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Ini Sudah Tidak Tersedia", HttpStatus.NOT_FOUND))
        }

        let carts = await CartModel.findOne({
            "user._id": req.body.user_id,
            "product_id": req.body.product_id
        })

        let product = carts.products.filter(product => product.id === req.body.product_id)

        if (product.length <= 0) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Tidak Ada Dalam Keranjang", HttpStatus.NOT_FOUND))
        }

        if (req.body.quantity <= 0) {
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation("Minimal 1 Kuantitas Yang Dapat Ditambahkan", HttpStatus.NOT_ACCEPTABLE))
        }

        if (product[0].stock <= 0) {
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation("Stok Tidak Tersedia", HttpStatus.NOT_ACCEPTABLE))
        }

        if ((product[0].quantity + req.body.quantity) > isProductExist.stock) {
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.validation(`Stok barang ini sisa ${isProductExist.stock}, dan kamu sudah punya ${product[0].quantity} di keranjangmu.`, HttpStatus.NOT_ACCEPTABLE))
        }

        let quantity
        let totalQuantity
        let subTotal
        let baseTotal

        switch (req.body.type) {
            case "plus":
                quantity = product[0].quantity + req.body.quantity
                totalQuantity = carts.totalQuantity + req.body.quantity
                subTotal = carts.subTotal + (product[0].price * req.body.quantity)
                baseTotal = carts.baseTotal + (product[0].price * req.body.quantity)
                break;
            case "minus":
                quantity = product[0].quantity - req.body.quantity
                totalQuantity = carts.totalQuantity - req.body.quantity
                subTotal = carts.subTotal - (product[0].price * req.body.quantity)
                baseTotal = carts.baseTotal - (product[0].price * req.body.quantity)
                break;
            case "multiply":
                quantity = req.body.quantity
                totalQuantity = (carts.totalQuantity - product[0].quantity) + req.body.quantity
                subTotal = (carts.subTotal - (product[0].price * product[0].quantity)) + (product[0].price * req.body.quantity)
                baseTotal = (carts.subTotal - (product[0].price * product[0].quantity)) + (product[0].price * req.body.quantity)
                break;
        }

        try {

            let cartUpdate = await CartModel.updateOne(
                {
                    "user._id": req.body.user_id,
                    "products._id": product[0]._id
                }, {
                $set: {
                    "products.$.quantity": quantity,
                    totalQuantity: totalQuantity,
                    subTotal: subTotal,
                    baseTotal: baseTotal
                }
            })

            return res.status(HttpStatus.OK).send(responser.success(cartUpdate, "Kuantitas Diperbarui"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Mengubah Produk", HttpStatus.BAD_REQUEST))

        }
    }

    async updateProductNoteByProductId(req, res) {

        const { error } = updateProductNoteByProductIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let user = await this.getUserById(req.body.user_id)

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("User Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let isProductExist = await this.isProductExist(req.body.product_id)

        console.log(isProductExist)

        if (!isProductExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Ini Sudah Tidak Tersedia", HttpStatus.NOT_FOUND))
        }

        try {

            let cartUpdate = await CartModel.updateOne(
                {
                    "user._id": req.body.user_id,
                    "products._id": req.body.product_id
                }, {
                $set: {
                    "products.$.note": req.body.note
                }
            })

            return res.status(HttpStatus.OK).send(responser.success(cartUpdate, "Catatan Ditambahkan"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Catatan", HttpStatus.BAD_REQUEST))

        }
    }

    async isProductExist(productId) {

        let product = await ProductModel.findOne({
            _id: productId
        })

        return product
    }

    async getUserById(userId) {

        let user = await UserModel.findOne({
            _id: userId
        })

        return user
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}


module.exports = new CartController
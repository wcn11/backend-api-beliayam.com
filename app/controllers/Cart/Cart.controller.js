const mongoose = require('mongoose');
const CartModel = require('@model/cart/cart.model')
const UserModel = require('@model/user/user.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const VoucherModel = require('@model/voucher/voucher.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const date = require('@helper/date')
const ChargeModel = require('@model/charge/charge.model')

const {
    getCartsValidation,
    addToCartValidation,
    applyVoucherValidation,
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

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy;

            if (!req.query.sortBy) {
                sortBy = req.query.sortBy === "ASC" ? 1 : -1
            }

            orderBy = req.query.orderBy ? `products.${req.query.orderBy}` : 'products.name'

            let carts = await CartModel.findOne({
                "user": req.user.user._id
            }).populate([{ path: 'user' }, {
                path: 'products',
                populate: {
                    path: 'productOnLive',
                },
            }, {
                    path: 'products',
                    populate: {
                        path: 'hasPromo',
                    },
                },
            ])
                .sort({
                    orderBy: sortBy
                }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            let cartFilterProductStillExist = []

            if (carts) {
                carts.user.otpEmail = undefined
                carts.user.otpSms = undefined
                carts.user.password = undefined

                cartFilterProductStillExist = carts.products.filter(async product => {
                    if (product.productOnLive !== null && product.productOnLive._id && product.productOnLive.status === "active") {
                        return product
                    } else {

                        await CartModel.updateOne({
                            "user": req.user.user._id,
                            "products._id": product._id
                        }, {
                            $pull: {
                                "products": {
                                    _id: product._id
                                }
                            },
                            $set: {
                                totalQuantity: carts.totalQuantity - product.quantity,
                                subTotal: carts.subTotal - (product.price * product.quantity),
                                baseTotal: carts.subTotal - (product.price * product.quantity)
                            }
                        });
                    }
                })
            }

            carts.products = cartFilterProductStillExist

            return res.status(HttpStatus.OK).send(responser.success(carts, HttpStatus.OK));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
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
                "user": req.body.user_id
            })

            let price = product.price;

            // let currentTime = date.time().toDate()

            // if (product.hasPromo &&
            //     product.hasPromo.isActive &&
            //     product.hasPromo.promoStart < currentTime &&
            //     product.hasPromo.promoEnd > currentTime) {

            //     if (product.hasPromo.promoBy === "percent") {
            //         let discountPrice =
            //             (product.hasPromo.promoValue / 100) * product.price;
            //         price = product.price - discountPrice;
            //     } else if (product.hasPromo.promoBy === "price") {
            //         price = product.price - product.hasPromo.promoValue;
            //     } else {
            //         price = product.price;
            //     }
            // } else if (product.hasDiscount && product.hasDiscount.isDiscount &&
            //     product.hasDiscount.discountStart < currentTime &&
            //     product.hasDiscount.discountEnd > currentTime) {
            //     if (product.hasDiscount.discountBy === "percent") {
            //         let discountPrice =
            //             (product.hasDiscount.discount / 100) * product.price;
            //         price = product.price - discountPrice;
            //     } else if (product.hasDiscount.discountBy === "price") {
            //         price = product.price - product.hasDiscount.discount;
            //     } else {
            //         price = product.price;
            //     }
            // }
            if (carts) {

                let isProductExist = carts.products.filter(product => product.id === req.body.product_id)

                if (isProductExist.length > 0) {

                    if ((isProductExist[0].quantity + input.quantity) > isProductExist[0].stock) {
                        return res.status(HttpStatus.OK).send(responser.validation(`Stok barang ini sisa ${product.stock} dan kamu sudah punya ${isProductExist[0].quantity} di keranjangmu.`, HttpStatus.OK))
                    }

                    await CartModel.updateOne(
                        {
                            "user": req.body.user_id,
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
                    return res.status(HttpStatus.OK).send(responser.validation("Melebihi Stok Tersedia Saat Ini", HttpStatus.OK))
                }

                await CartModel.updateOne(
                    {
                        "user": req.body.user_id
                    }, {
                    $set: {

                        totalQuantity: carts.totalQuantity + input.quantity,
                            subTotal: carts.subTotal + (price * input.quantity),
                            baseTotal: carts.baseTotal + (price * input.quantity)
                    },
                    $push: {
                        products: {
                            _id: product._id,
                            slug: product.slug,
                            sku: product.sku,
                            name: product.name,
                            position: product.position,
                            quantity: input.quantity,
                            price: price,
                            weight: product.weight,
                            image: product.image,
                            status: product.status,
                            additional: product.additional,
                            description: product.description,
                            note: input.note ?? "",
                            hasPromo: product.hasPromo,
                            hasDiscount: product.hasDiscount,
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
                    price: price,
                    image: product.image ?? "images/product/default.jpg",
                    status: product.status,
                    additional: product.additional,
                    description: product.description,
                    weight: product.weight,
                    note: input.note ?? "",
                    hasPromo: product.hasPromo,
                    hasDiscount: product.hasDiscount,
                    productOnLive: product._id
                },
                user: req.body.user_id,
                totalQuantity: input.quantity,
                subTotal: price * input.quantity,
                baseTotal: price * input.quantity
            }


            let cart = new CartModel(cartObject)

            const savedCart = await cart.save()

            return res.status(HttpStatus.OK).send(responser.success(savedCart, "Produk Ditambahkan Ke Keranjang"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Produk", HttpStatus.BAD_REQUEST))

        }
    }

    async deleteProductAtCartByProductId(req, res) {

        req.body = req.params

        const { error } = deleteProductAtCartByProductIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let carts = await CartModel.findOne({
            "user": req.body.user_id,
            "products.product_id": req.body.product_id
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
                "user": req.body.user_id,
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
            "user": req.body.user_id,
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
                    "user": req.body.user_id,
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

        if (!isProductExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Ini Sudah Tidak Tersedia", HttpStatus.NOT_FOUND))
        }

        try {

            let cartUpdate = await CartModel.updateOne(
                {
                    "user": req.body.user_id,
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

    async applyVoucher(req, res) {

        const { error } = applyVoucherValidation(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(
                responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let isUserIdValid = this.isIdValid(req.body.user_id)

        if (!isUserIdValid) {
            return res.status(HttpStatus.OK).send(
                responser.error("ID User Tidak Valid", HttpStatus.OK))
        }

        let cartObject = await CartModel.findOne({
            user: req.body.user_id
        })

        if (!cartObject) {
            return res.status(HttpStatus.OK).send(
                responser.error("Belum Ada Barang Untuk Diterapkan Voucher", HttpStatus.OK))
        }

        if (req.user.user._id !== req.body.user_id) {
            return res.status(HttpStatus.OK).send(
                responser.error("Pengguna Tidak Sama Dengan Sesi Login Saat Ini", HttpStatus.OK))
        }

        let voucherCode = req.query.voucherCode

        let isVoucherExist

        if (!voucherCode) {

            isVoucherExist = await this.isVoucherExist(req.body.voucher_id, "id")
        } else {
            isVoucherExist = await this.isVoucherExist(voucherCode, "code")

        }

        if (!isVoucherExist) {
            return res.status(HttpStatus.NOT_FOUND).send(
                responser.error("Voucher Tidak Valid", HttpStatus.NOT_FOUND))
        }

        let currentDate = date.time().toDate()

        if (!isVoucherExist.isActive) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher Tidak Aktif", HttpStatus.OK))
        }

        if (isVoucherExist.discountStart > currentDate) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher Belum Aktif", HttpStatus.OK))
        }

        if (isVoucherExist.discountEnd < currentDate) {
            return res.status(HttpStatus.OK).send(
                responser.error("Voucher Kadaluarsa", HttpStatus.OK))
        }

        let platform = await isVoucherExist.platform.map(value => {
            if (value === "all") {
                return true
            } else if (value === req.body.platform) {
                return true
            } else {
                return false
            }
        })

        if (!platform) {

            return res.status(HttpStatus.OK).send(
                responser.error(`Voucher Tidak Dapat Digunakan Diperangkat Ini`, HttpStatus.OK))
        }

        let isCartExist = await this.isCartExist(req.user.user._id)

        if (!isCartExist) {
            return res.status(HttpStatus.OK).send(
                responser.error("Keranjang Tidak Ditemukan", HttpStatus.OK))
        }

        let charges = await this.getAllCharge()

        const calculateCharge = charges.reduce((accumulator, charge) => {

            if (charge.chargeBy === "price") {
                return accumulator + parseInt(charge.chargeValue)
            }

            // else if (charge.chargeBy === "percent") {
            //     return accumulator + ((charge.chargeValue / 100) * calculateItem)
            // }
            else {
                return accumulator
            }
        }, 0)

        if (isVoucherExist.isPrivate.private) {
            let isUserExist = isVoucherExist.isPrivate.users.filter(user => user === req.body.user_id)

            if (isUserExist.length <= 0) {

                return res.status(HttpStatus.OK).send(
                    responser.error(`Voucher Ini Private, Tidak Dapat Digunakan Oleh Anda`, HttpStatus.OK))
            }
        }

        if (isVoucherExist.minimumOrderBy === "quantity") {

            if (isCartExist.totalQuantity < isVoucherExist.minimumOrderValue) {

                return res.status(HttpStatus.OK).send(responser.validation(`Belum mencapai minimum kuantitas. min: ${isVoucherExist.minimumOrderValue} kuantitas`, HttpStatus.OK))
            }
        }

        if (isVoucherExist.minimumOrderBy === "price") {

            if ((isCartExist.baseTotal - calculateCharge) <= isVoucherExist.minimumOrderValue) {

                let totalMinPrice = this.formatMoney(isVoucherExist.minimumOrderValue)

                return res.status(HttpStatus.OK).send(responser.validation(`Belum mencapai minimum belanja total. Total minimum: ${totalMinPrice} `, HttpStatus.OK))
            }
        }

        // if (isVoucherExist.minimumOrderValue > cartObject.subTotalProduct) {

        //     return res.status(HttpStatus.OK).send(
        //         responser.error(`Belum Mencapai Minimum Belanja`, HttpStatus.OK))
        // }

        return res.status(HttpStatus.OK).send(responser.success(isVoucherExist, "OK"));

    }

    async isCartExist(user_id) {

        let cart = await CartModel.findOne({
            user: user_id
        })

        return cart

    }

    async getAllCharge(defaultCharge = "checkout", platform = "all", isActive = true) {

        const charges = await ChargeModel.find(
            {
                "default": defaultCharge,
                "isActive": isActive,
                "platform": {
                    "$in": [platform]
                },
            }
        );

        return charges
    }

    async isProductExist(productId) {

        let product = await ProductModel.findOne({
            _id: productId
        }).populate("hasPromo")

        return product
    }

    async getUserById(userId) {

        let user = await UserModel.findOne({
            _id: userId
        })

        return user
    }

    async isVoucherExist(voucherBy, type = "code") {

        let voucher

        if (type.toLowerCase() === "code") {

            voucher = await VoucherModel.findOne({
                voucherCode: voucherBy
            })
        } else if (type.toLowerCase() === "id") {

            voucher = await VoucherModel.findOne({
                _id: voucherBy
            })
        }

        return voucher

    }

    formatMoney(val) {
        let formatter = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        });

        return formatter.format(val);
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}


module.exports = new CartController

const mongoose = require('mongoose');
const CategoryModel = require('@model/category/category.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')


const {
    addProductValidation,
    getProductsValidation,
    getProductByIdValidation,
    updateProductByIdValidation,
    deleteProductByIdValidation,
    getProductsByCategoryIdValidation

} = require('@validation/product/product.validation')

const ProductController = class ProductController {

    async getProducts(req, res) {

        const { error } = getProductsValidation(req.query)

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
            sortBy = req.query.sortBy ?? 1

            if (!req.query.orderBy) {
                orderBy = req.query.orderBy ?? "name"
            }
            orderBy = req.query.orderBy ?? 1

            let products = await ProductModel.find({
                active: true,
            }).populate(['category', 'hasPromo'])
                .sort({
                    orderBy: sortBy
                }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(products, HttpStatus.OK));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }

    async getProductsByCategoryId(req, res) {

        const { error } = getProductsByCategoryIdValidation(req.query)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.categoryId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Produk Yang Dicari Tidak Ditemukan", HttpStatus.BAD_REQUEST)
            );
        }

        try {

            let page = req.query.page ?? 1
            let show = req.query.show ?? 10

            let sortBy;

            let orderBy;

            if (!req.query.sortBy) {
                sortBy = req.query.sortBy === "ASC" ? 1 : -1
            }
            sortBy = req.query.sortBy ?? 1

            if (!req.query.orderBy) {
                orderBy = req.query.orderBy ?? "name"
            }
            orderBy = req.query.orderBy ?? 1

            let user = await ProductModel.find({
                category: {
                    $in: [req.params.categoryId]
                },
                active: true,

            }).populate(['category', 'hasPromo'])
                .sort({
                    orderBy: sortBy
                }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user, HttpStatus.OK));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }
    }
    // async getProductByName(){

    // }

    async getProductById(req, res) {

        const { error } = getProductByIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.productId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Produk ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let product = await ProductModel.findOne({
            _id: req.params.productId
        }).populate(['category', 'hasPromo'])

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        return res.status(HttpStatus.OK).send(responser.success(product, HttpStatus.OK));
    }

    async createProduct(req, res) {

        const { error } = addProductValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!this.isIdValid(req.body.category_id)) {
            return false;
        }

        // buat jika ada sku duplikat

        try {

            let input = req.body

            let category = await this.isCategoryExists(input.category_id)

            if (!category) {
                return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Kategori Tidak Ditemukan", HttpStatus.NOT_FOUND))
            }

            let productObject = {

                category: [
                    category._id,
                ],
                sku: input.sku,
                name: input.name,
                position: input.position,
                price: input.price,
                stock: input.stock,
                status: input.status,
                additional: input.additional,
                description: input.description
            }

            if (req.file) {
                productObject.image = req.file ? req.file.url : "images/product/default.jpg"
            }

            if (input.isDiscount) {
                productObject.hasDiscount = {
                    isDiscount: input.isDiscount,
                    discount: input.discount,
                    discountBy: input.discountBy,
                    discountStart: input.discountStart,
                    discountEnd: input.discountEnd,
                    priceAfterDiscount: input.priceAfterDiscount,
                }
            }

            let product = new ProductModel(productObject)

            const savedProduct = await product.save()

            return res.status(HttpStatus.OK).send(responser.success(savedProduct, "Produk Ditambahkan"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Produk, Harap Cek Duplikasi", HttpStatus.BAD_REQUEST))

        }
    }

    async deleteProductById(req, res) {

        const { error } = deleteProductByIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let product = await ProductModel.findOne({
            _id: req.params.productId
        })

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Produk Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {

            await ProductModel.deleteOne({
                _id: req.params.productId
            });

            return res.status(HttpStatus.OK).send(responser.validation("Produk Telah Dihapus", HttpStatus.OK))

        } catch (err) {

            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Tidak Bisa Menghapus Produk", HttpStatus.NOT_MODIFIED))

        }
    }

    async updateProductById(req, res) {

        const { error } = updateProductByIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.productId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Produk Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const isProductExist = await ProductModel.findOne({ _id: req.params.productId })

        if (!isProductExist) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Produk Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let category = await this.isCategoryExists(req.body.category_id)

        if (!category) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Kategori Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        // buat jika ada sku duplikat

        try {

            let input = req.body

            let productObject = {

                category: [
                    category._id,
                ],
                sku: input.sku,
                name: input.name,
                position: input.position,
                price: input.price,
                stock: input.stock,
                status: input.status,
                additional: input.additional,
                description: input.description
            }

            if (req.file) {
                productObject.image = req.file.path
            }

            if (input.isDiscount) {
                productObject.hasDiscount = {
                    isDiscount: input.isDiscount,
                    discount: input.discount,
                    discountBy: input.discountBy,
                    discountStart: input.discountStart,
                    discountEnd: input.discountEnd
                }
            }

            if (input.promo) {
                productObject.hasPromo = input.promo
            }

            const product = await ProductModel.findOneAndUpdate(
                req.params.productId, {
                $set: productObject
            }, {
                new: true
            }).select({
                category: 1,
                sku: 1,
                name: 1,
                position: 1,
                image: 1,
                status: 1,
                additional: 1,
                description: 1,
                price: 1,
                stock: 1,
                hasDiscount: 1,
                hasPromotion: 1,
            })

            return res.status(HttpStatus.OK).send(responser.success(product, "Produk Diperbarui"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Mengubah Produk, Harap Cek Input", HttpStatus.BAD_REQUEST))

        }
    }

    async isCategoryExists(categoryId) {

        let category = await CategoryModel.findOne({
            _id: categoryId
        })

        return category
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}


module.exports = new ProductController
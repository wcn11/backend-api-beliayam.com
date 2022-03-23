
const mongoose = require('mongoose');
const VoucherModel = require('@model/voucher/voucher.model')
const UserModel = require('@model/user/user.model')
const ChargeModel = require('@model/charge/charge.model')
const ProductModel = require('@model/product/product.model')
const customId = require("custom-id");
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')


const {
    createNewChargeValidation,
    getAllChargesValidation,
    updateChargeByChargeIdValidation,
    getChargeByChargeIdValidation,
    deleteChargeByChargeIdValidation

} = require('@validation/charge/charge.validation')

const ChargeController = class ChargeController {

    async getAllCharges(req, res) {

        const { error } = getAllChargesValidation(req.query)

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
                orderBy = req.query.orderBy ?? "chargeName"
            }
            orderBy = req.query.orderBy ?? 1

            let user = await ChargeModel.find({}).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user, HttpStatus.OK));

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Format Query Salah", HttpStatus.BAD_REQUEST));
        }

    }

    async getChargeByChargeId(req, res) {

        const { error } = getChargeByChargeIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.params.chargeId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Biaya Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        try {

            let isChargeExist = await ChargeModel.findOne({
                _id: req.params.chargeId
            })

            if (!isChargeExist) {
                return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Biaya Tidak Ditemukan", HttpStatus.NOT_FOUND))
            }

            return res.status(HttpStatus.OK).send(responser.success(isChargeExist))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Tidak Dapat Mengambil Data Biaya", HttpStatus.BAD_REQUEST))

        }

    }

    async deleteChargeByChargeId(req, res) {

        const { error } = deleteChargeByChargeIdValidation(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.chargeId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Biaya Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let isChargeExist = await this.getChargeByChargeBy(req.params.chargeId)

        if (!isChargeExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Biaya Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {

            await ChargeModel.findOneAndRemove({
                _id: req.params.chargeId
            });

            return res.status(HttpStatus.OK).send(responser.validation("Biaya Telah Dihapus", HttpStatus.OK))

        } catch (err) {

            return res.status(HttpStatus.NOT_MODIFIED).send(responser.error("Biaya Tidak Dapat Dihapus", HttpStatus.NOT_MODIFIED))

        }
    }

    async createNewCharge(req, res) {

        const { error } = createNewChargeValidation(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(
                responser.error(error.details[0].message, HttpStatus.OK))
        }

        let input = req.body

        let isChargeNameDuplicate = await this.getChargeByChargeBy(input.chargeName)

        if (isChargeNameDuplicate && isChargeNameDuplicate.chargeName.toUpperCase() === input.chargeName.toUpperCase()) {
            return res.status(HttpStatus.OK).send(responser.validation(`Sudah Ada Biaya Dengan Nama: ${input.chargeName}`, HttpStatus.OK))
        }

        try {

            let chargeObject = {
                chargeName: input.chargeName,
                chargeBy: input.chargeBy,
                chargeValue: input.chargeValue,
                shortDescription: input.shortDescription,
                description: input.description,
                default: input.default,
                private: input.status,
                users: input.users,
                termsAndConditions: input.termsAndConditions,
                isActive: input.isActive,
                platform: input.platform
            }

            let charge = new ChargeModel(chargeObject)

            const savedCharge = await charge.save()

            return res.status(HttpStatus.OK).send(responser.success(savedCharge, `Biaya ${input.chargeName} Dibuat`))
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Tidak Dapat Memperbarui Biaya", HttpStatus.BAD_REQUEST))

        }
    }

    async updateChargeByChargeId(req, res) {

        const { error } = updateChargeByChargeIdValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.params.chargeId)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Charge ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        let isChargeExist = await this.getChargeByChargeBy(req.params.chargeId, 'id')

        if (!isChargeExist) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Biaya Tidak Ditemukan", HttpStatus.BAD_REQUEST))
        }

        let input = req.body

        let chargeObject = {
            chargeName: input.chargeName,
            chargeBy: input.chargeBy,
            chargeValue: input.chargeValue,
            shortDescription: input.shortDescription,
            description: input.description,
            default: input.default,
            termsAndConditions: input.termsAndConditions,
            isActive: input.isActive,
            plaform: input.plaform
        }

        if (req.body.private) {
            chargeObject.isPrivate = {
                private: req.body.private,
                users: req.body.private.user
            }
        }
        try {

            const charge = await ChargeModel.findOneAndUpdate(
                req.params.chargeId, {
                $set: chargeObject
            }, {
                new: true
            }).select({
                chargeName: 1,
                chargeBy: 1,
                chargeValue: 1,
                shortDescription: 1,
                description: 1,
                default: 1,
                termsAndConditions: 1,
                isActive: 1,
                plaform: 1
            })

            return res.status(HttpStatus.OK).send(responser.success(charge, `Biaya ${req.body.chargeName} Diperbarui`))
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Tidak Dapat Memperbarui Biaya", HttpStatus.BAD_REQUEST))

        }
    }

    async getChargeByChargeBy(chargeField, type = "chargeName") {

        let search

        if (type === "chargeName") {
            search = {
                chargeName: chargeField
            }
        } else if (type.toLocaleLowerCase() === "id") {
            search = {
                _id: chargeField
            }
        }

        let charge = await ChargeModel.findOne({
            search
        })

        return charge
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


module.exports = new ChargeController
// const User = require('@model/user/user.model')
// const { create } = require('@validation/address/address.validation')
// const customId = require("custom-id");
// const SMSGateway = require('@service/SMS.gateway')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

// const {
//     addAddress,
//     getAddressById,
//     updateAddress,
//     deleteAddressByAddressId
// } = require('@validation/address/address.validation')
const RegionModel = require('@model/region/region.model')

const RegionController = class RegionController {


    async getAllProvince(req, res) {

        try {

            const getAllProvince = await RegionModel.getAllProvince()

            return res.status(HttpStatus.OK).send(responser.success(getAllProvince));

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Gagal Memuat Data Provinsi", HttpStatus.INTERNAL_SERVER_ERROR));
        }

    }

    async getProvince(req, res) {

        try {

            const getProvince = await RegionModel.getProvince(req.params.provinceId)

            return res.status(HttpStatus.OK).send(responser.success(getProvince));

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Gagal Memuat Data Provinsi", HttpStatus.INTERNAL_SERVER_ERROR));
        }

    }

    async getRegency(req, res) {

        try {

            const getRegency = await RegionModel.getRegency(req.params.regencyId)

            return res.status(HttpStatus.OK).send(responser.success(getRegency));

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Gagal Memuat Data Kota/Kabupaten", HttpStatus.INTERNAL_SERVER_ERROR));
        }

    }

    async getDistrict(req, res) {

        try {

            const getDistrict = await RegionModel.getDistrict(req.params.districtId)

            return res.status(HttpStatus.OK).send(responser.success(getDistrict));

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Gagal Memuat Data Kecamatan", HttpStatus.INTERNAL_SERVER_ERROR));
        }

    }

    async getVillage(req, res) {

        try {

            const getVillage = await RegionModel.getVillage(req.params.villageId)

            return res.status(HttpStatus.OK).send(responser.success(getVillage));

        } catch (err) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Gagal Memuat Data Kelurahan", HttpStatus.INTERNAL_SERVER_ERROR));
        }

    }

}

module.exports = new RegionController
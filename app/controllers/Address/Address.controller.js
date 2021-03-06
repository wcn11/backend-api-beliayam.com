const User = require('@model/user/user.model')
const { create } = require('@validation/address/address.validation')
const customId = require("custom-id");
const SMSGateway = require('@service/SMS.gateway')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')

const {
    addAddress,
    getAddressById,
    updateAddress,
    updateDefaultAddressValidator,
    deleteAddressByAddressId
} = require('@validation/address/address.validation')

const AddressController = class AddressController {

    async storeAdressByUserId(req, res) {

        const { error } = addAddress(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }


        if (req.user.user._id !== req.body.user_id) {

            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Pengguna Tidak Sesuai Dengan Sesi Login Saat Ini", HttpStatus.UNAUTHORIZED))
        }

        const addressFull = await User.aggregate([{
            $match: {
                "addresses.user_id": req.body.user_id
            }
        },
        ])

        let setDefault = req.body.default

        if (addressFull.length > 0) {

            if (addressFull[0].addresses.length >= 5) {

                return res.status(HttpStatus.OK).send(responser.error("Maksimal 5 Alamat Yang Dapat Dibuat", HttpStatus.OK))

            }

        }

        const old_address = await User.aggregate([
            {
                $match: {
                    "addresses.user_id": req.body.user_id,
                    "addresses.default": true
                }
            },
            { $unwind: "$addresses" },
            {
                $group: {
                    "_id": "$_id",
                    address: {
                        $first: "$addresses"
                    }
                }
            }
        ])


        if (old_address.length > 0) {
            await User.updateOne({
                _id: req.body.user_id,
                "addresses._id": old_address[0].address._id,
            }, {
                $set: {
                    'addresses.0.default': false
                }
            })
        }

        try {

            let addresses = {
                "_id": customId({}),
                "label": req.body.label,
                "user_id": req.body.user_id,
                "receiver_name": req.body.receiver_name,
                "address1": req.body.address1,
                "address2": req.body.address2,
                "city": req.body.city,
                "state": req.body.state,
                "district": req.body.district,
                "sub_district": req.body.sub_district,
                "postcode": req.body.postcode,
                "phone": req.body.phone,
                "default": setDefault || false,
                "details": req.body.details,
            }

            if (req.body.maps) {
                addresses.maps = {
                    "latitude": req.body.maps.latitude,
                    "longitude": req.body.maps.longitude
                }
            }

            await User.updateOne(
                {
                    _id: req.body.user_id
                }, {
                $push: {
                    addresses: addresses
                }
            }, {
                $project: {
                    _id: 1
                }
            })

            return res.status(HttpStatus.OK).send(responser.success([], "Alamat Baru Dibuat", HttpStatus.OK))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Menambahkan Alamat Baru", HttpStatus.BAD_REQUEST))

        }
    }

    async updateAdressByAddressId(req, res) {

        req.body._id = req.params.addressId

        const { error } = updateAddress(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const isAddressExist = await User.findOne({ "addresses._id": req.params.addressId })

        if (!isAddressExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Alamat Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        try {

            let addresses = {
                "_id": req.params.addressId,
                "label": req.body.label,
                "user_id": req.body.user_id,
                "receiver_name": req.body.receiver_name,
                "address1": req.body.address1,
                "address2": req.body.address2,
                "city": req.body.city,
                "state": req.body.state,
                "district": req.body.district,
                "sub_district": req.body.sub_district,
                "postcode": req.body.postcode,
                "phone": req.body.phone,
                "default": req.body.default || false,
                "details": req.body.details
            }

            if (req.body.maps) {
                addresses.maps = {
                    "latitude": req.body.maps.latitude,
                    "longitude": req.body.maps.longitude
                }
            }

            const addressUpdate = await User.updateOne({
                _id: req.user.user._id,
                "addresses": {
                    "$elemMatch": {
                        _id: req.params.addressId
                    }
                }
            }, {
                $set: {
                    "addresses.$": addresses
                }
            }, { upsert: true })

            return res.status(HttpStatus.OK).send(responser.success(addresses, "Alamat Perbarui"))

        } catch (err) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Perbarui Alamat", HttpStatus.BAD_REQUEST))

        }
    }

    async updateDefaultAdress(req, res) {

        const { error } = updateDefaultAddressValidator(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let isAddressExist = await User.aggregate([
            {
                $match: {
                    "addresses._id": req.body.address_id,
                    "addresses.user_id": req.body.user_id,
                }
            },
            { $unwind: "$addresses" },
            {
                $group: {
                    "_id": "$_id",
                    address: {
                        $first: "$addresses"
                    }
                }
            }
        ])

        if (isAddressExist.length <= 0) {
            return res.status(HttpStatus.OK).send(responser.error("Alamat Tidak Ditemukan", HttpStatus.OK));
        }

        // try {

        let isAddressDefaultExist = await User.findOne(
            {
                "addresses.user_id": {
                    $eq: req.body.user_id
                }
            })



        // if (isAddressDefaultExist && isAddressDefaultExist.addresses.length > 0) {


        //     console.log(isAddressDefaultExist.addresses[0]._id)
        //     if (isAddressDefaultExist.addresses[0]._id === req.body.address_id) {

        //         return res.status(HttpStatus.OK).send(responser.success({}, "Alamat diperbarui 1"))
        //     }


        //     await User.updateOne({
        //         _id: req.body.user_id,
        //         "addresses._id": isAddressDefaultExist.addresses[0]._id
        //     }, {
        //         $set: {
        //             "addresses.$.default": false
        //         }
        //     }, { upsert: true })
        // }

        if (req.body.maps) {
            addresses.maps = {
                "latitude": req.body.maps.latitude,
                "longitude": req.body.maps.longitude
            }
        }
        await User.updateOne({
            _id: req.body.user_id,
            "addresses._id": req.body.address_id
        }, {
            $set: {
                "addresses.$.default": true
            }
        }, { upsert: true })


        return res.status(HttpStatus.OK).send(responser.success({}, "Alamat diperbarui"))

        // } catch (err) {

        //     return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Tidak Dapat Perbarui Alamat", HttpStatus.BAD_REQUEST))

        // }
    }

    async getAddressesByUserId(req, res) {

        let address = await User.aggregate([
            {
                $match: {
                    "addresses.user_id": req.query.user_id,
                }
            },
            { $unwind: "$addresses" },
            {
                $group: {
                    "_id": "$_id",
                    address: {
                        $push: "$addresses"
                    }
                }
            }
        ])

        return res.status(HttpStatus.OK).send(responser.success(address, 'Alamat berhasil dihapus'))

    }

    async getAddressByUserId(req, res) {

        req.body.address_id = req.params.addressId
        req.body.user_id = req.user.user._id

        const { error } = getAddressById(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let address = await User.aggregate([
            {
                $match: {
                    "addresses._id": req.body.address_id,
                    "addresses.user_id": req.body.user_id,
                }
            },
            { $unwind: "$addresses" },
            {
                $group: {
                    "_id": "$_id",
                    address: {
                        $first: "$addresses"
                    }
                }
            }
        ])

        if (!address.length) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Alamat Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        return res.status(HttpStatus.OK).send(responser.success(address, HttpStatus.OK))

    }

    async deleteAddressByAddressId(req, res) {

        const { error } = deleteAddressByAddressId(req.params)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let address = await User.aggregate([
            {
                $match: {
                    "addresses._id": req.params.addressId,
                    "addresses.user_id": req.user.user._id,
                }
            },
            { $unwind: "$addresses" },
            {
                $group: {
                    "_id": "$_id",
                    address: {
                        $first: "$addresses"
                    }
                }
            }
        ])

        if (!address.length) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Alamat Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        try {

            const deleteUser = await User.updateOne({
                "addresses._id": req.params.addressId,
            }, {
                $pull: {
                    addresses: {
                        _id: req.params.addressId
                    }
                }
            });

            return res.status(HttpStatus.OK).send(responser.success({}, "Alamat Telah Dihapus"))
        } catch (err) {
            return res.status(HttpStatus.NOT_MODIFIED).error(responser.error("Tidak Bisa Menghapus Alamat", HttpStatus.NOT_MODIFIED))
        }

    }

}


module.exports = new AddressController
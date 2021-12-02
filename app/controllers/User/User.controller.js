const mongoose = require('mongoose');
const User = require('@model/user/user.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const SMSGateway = require('@service/SMS.gateway')
const moment = require('moment')
const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const {
    addPhone,
    changeNameUser,
    changeEmailUser,
    updateActiveUserValidation
} = require('@validation/user/user.validation')

const UserController = class UserController {

    async getUsers(req, res) {

        let page = req.query.page ?? 1
        let show = req.query.show ?? 10

        let sortBy;

        let orderBy;

        if (!req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        }
        sortBy = req.query.sortBy ?? 1

        if (!req.query.orderBy) {
            orderBy = req.query.orderBy === "ASC" ? 1 : -1
        }
        orderBy = req.query.orderBy ?? 1

        try {

            let user = await User.find({}).sort({
                orderBy: sortBy
            }).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user, HttpStatus.OK));
        } catch (err) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Format", HttpStatus.NOT_FOUND));
        }
    }

    async addPhone(req, res) {

        const { error } = addPhone(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const user = await User.findOne({ _id: req.body.user_id })

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Pengguna Tidak Ditemukan", HttpStatus.BAD_REQUEST)
            );
        }

        if (user.phone) {
            if (user.isPhoneVerified) {
                return res.status(HttpStatus.NOT_ACCEPTABLE).send(
                    responser.error("Tidak Bisa Mem-verifikasi Ulang Nomor Yang Sama Dengan Nomor Anda Yang Telah Terdaftar Dan Terverifikasi", HttpStatus.NOT_ACCEPTABLE)
                );
            }
        }

        var otp = parseInt(Math.random() * 10000);

        // let sendSms = SMSGateway.sendSms({
        //     from: "BELIAYAMCOM",
        //     to: "62895402275040",
        //     text: `Kode OTP Anda Adalah: ${otp} \r\nJANGAN MEMBERITAHU KODE RAHASIA INI KE SIAPAPUN TERMASUK PIHAK PT. BELI AYAM COM
        //     `
        // });

        //5 minutes on milliseconds
        let expiredTime = 300000
        let expired = moment().add(expiredTime, 'milliseconds')

        await User.updateOne({
            _id: req.body.user_id
        }, {
            phone: req.body.phone,
            isPhoneVerified: false,
            otpSms: {
                code: otp,
                attempts: 0,
                expiredDate: expired,
                expired: false
            }
        }, {
            upsert: true
        })

        client.setex(`smsOtp.${req.body.user_id}`, expiredTime, JSON.stringify(otp));

        return res.status(HttpStatus.OK).send(
            responser.success(
                {
                    otpSms: {
                        expiredDate: expired,
                        expired: false
                    }
                }, "Kode OTP Telah Dikirm Ke Nomor Telepon Anda, Harap Cek Telepon Anda")
        );
    }

    async changeName(req, res) {

        const { error } = changeNameUser(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        try {
            const user = await User.findOneAndUpdate(
                req.body.user_id, {
                $set: {
                    name: req.body.name,
                }
            }, {
                new: true
            }).select({
                otpEmail: 0,
                otpSms: 0,
                addresses: 0
            })

            res.status(HttpStatus.OK).send(responser.success(user,
                "Nama Diperbarui",
                HttpStatus.OK))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.success([],
                "Tidak Bisa Mengganti Nama",
                HttpStatus.BAD_REQUEST))
        }

    }

    async changeEmail(req, res) {

        const { error } = changeEmailUser(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        try {
            const user = await User.findOneAndUpdate(
                req.body.user_id, {
                $set: {
                    email: req.body.new_email,
                        "otpEmail": {
                            "code": 0,
                            "attempts": 0,
                            "expired": false,
                            "expiredDate": Date.now()
                        },
                        "isEmailVerified": false
                }
            }, {
                new: true
            }).select({
                otpEmail: 0,
                otpSms: 0,
                addresses: 0,
                password: 0
            })

            res.status(HttpStatus.OK).send(responser.success(user,
                "Email Diperbarui, Harap Verifikasi Kembali Email Yang Baru",
                HttpStatus.OK))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.success([],
                "Tidak Bisa Perbarui Email",
                HttpStatus.BAD_REQUEST))
        }

    }

    async updateActiveUser(req, res){

        const { error } = updateActiveUserValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        let isActive = false
        let messageStatus = "Akun Diaktifkan"

        if(req.body.active) {
            isActive = true
        }else{
            isActive = false
            messageStatus = "Akun Dinon-Aktifkan"
        }

        const user = await User.findOneAndUpdate(
            req.body.user_id, {
            $set: {
                isActive: isActive
            }
        }, {
            new: true
        }).select({
            otpEmail: 0,
            otpSms: 0,
            addresses: 0,
            password: 0,
        })

        res.status(HttpStatus.OK).send(responser.success(user,
            messageStatus,
            HttpStatus.OK))
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}

module.exports = new UserController
const mongoose = require('mongoose');
const User = require('@model/user/user.model')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const SMSGateway = require('@service/SMS.gateway')
const date = require('@helper/date')
const bcrypt = require('bcryptjs')
const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const OrderModel = require('@model/order/order.model')

const PaymentResponse = require('@utility/payment/paymentResponse.lists')
const paymentStatus = require('@utility/payment/paymentStatus.lists')

const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890', 4) // NO LETTER 

const SendVerifyEmail = require('@mailService/SendVerifyEmail.mail')

const {
    addPhone,
    changeNameUser,
    changeEmailUser,
    emailVerify,
    getOrdersValidation,
    resendEmailVerify,
    changePasswordValidator,
    updateActiveUserValidation,
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

            let user = await User.find({},
                {
                    password: 0,
                    otpEmail: 0,
                    otpSms: 0
                }).sort({
                    orderBy: sortBy
                }
                ).skip((parseInt(page) - 1) * parseInt(show)).limit(parseInt(show))

            return res.status(HttpStatus.OK).send(responser.success(user, HttpStatus.OK));
        } catch (err) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Invalid Format", HttpStatus.NOT_FOUND));
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
            return res.status(HttpStatus.OK).send(
                responser.error("Pengguna Tidak Ditemukan", HttpStatus.OK)
            );
        }

        const isPhoneAlreadyExist = await User.findOne({ phone: req.body.phone })

        if (isPhoneAlreadyExist) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Yang Anda Masukkan Telah Terdaftar", HttpStatus.OK)
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

        //5 minutes on milliseconds
        let expiredTime = 300000
        let expired = date.time(expiredTime, 'milliseconds')

        if (req.query.sendSms === 'false') {

            await User.updateOne({
                _id: req.body.user_id
            }, {
                phone: req.body.phone,
                isPhoneVerified: false,
                otpSms: {
                    code: 0,
                    attempts: 0,
                    expiredDate: Date.now(),
                    expired: false
                }
            }, {
                upsert: true
            })
            return res.status(HttpStatus.OK).send(
                responser.success({}, "Nomor Telepon Telah Ditambahkan")
            );
        }

        SMSGateway.sendSms({
            to: req.body.phone,
            text: `Masukan Kode text: ${otp} ini pada aplikasi beliayamcom. JANGAN MEMBERIKAN KODE KEPADA SIAPAPUN TERMASUK PIHAK BELIAYAMCOM`

        });

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
                responser.error("ID Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        try {

            await User.updateOne({
                _id: req.body.user_id
            }, {
                $set: {
                    name: req.body.name,
                }
            }, { upsert: true })
                .select({
                    otpEmail: 0,
                    otpSms: 0,
                    addresses: 0
                })

            res.status(HttpStatus.OK).send(responser.success({},
                "Nama Diperbarui",
                HttpStatus.OK))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.success([],
                "Tidak Bisa Mengganti Nama",
                HttpStatus.BAD_REQUEST))
        }

    }

    async getCurrentUser(req, res) {

        try {


            const user = await User.findOne({ _id: req.user.user._id })

            res.status(HttpStatus.OK).send(responser.success(user,
                "OK",
                HttpStatus.OK))
        }
        catch (err) {

            res.status(HttpStatus.UNAUTHORIZED).send(responser.success([],
                "Gagal Memuat Data",
                HttpStatus.UNAUTHORIZED))
        }
    }

    async changeEmail(req, res) {

        const { error } = changeEmailUser(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        if (userExist.email) {

            if (req.body.new_email.toLowerCase() === userExist.email.toLowerCase()) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Anda Memasukkan Alamat Email Yang Sama Dengan Alamat Email Saat Ini", HttpStatus.BAD_REQUEST));
            }
        }

        const emailExist = await User.findOne({ email: req.body.new_email })

        if (emailExist) {
            return res.status(HttpStatus.OK).send(responser.error("Alamat Email Yang Anda Masukkan Telah Terdaftar", HttpStatus.OK));
        }

        const otp = nanoid();

        let expiredTime = 1200000 //20 minutes on milliseconds
        let expired = date.time(expiredTime, 'milliseconds')

        console.log(otp);

        try {
            const user = await User.updateOne({
                _id: req.body.user_id
            }, {
                $set: {
                    email: req.body.new_email,
                    "otpEmail": {
                        "code": otp,
                        "attempts": 0,
                        "expired": false,
                        "expiredDate": expired
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

            SendVerifyEmail.send({
                to: req.body.new_email,
                subject: "Verifikasi Email | Beliayam.com",
                otp: otp,
                name: userExist.name ?? "Pelanggan Beliayam.com"
            })

            client.set(`emailOtp.${userExist._id}`, JSON.stringify(otp), 'EX', expiredTime);

            res.status(HttpStatus.OK).send(responser.success(user,
                "Email Diperbarui, Harap Verifikasi Kembali Email Yang Baru",
                HttpStatus.OK))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.error(
                "Tidak Bisa Perbarui Email",
                HttpStatus.BAD_REQUEST))
        }

    }

    async updateActiveUser(req, res) {

        const { error } = updateActiveUserValidation(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_isAXREQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        if (!userExist.active) {
            return res.status(HttpStatus.FORBIDDEN).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.FORBIDDEN));
        }

        await User.updateOne({
            _id: req.body.user_id
        }, {
            $set: {
                active: false

            }
        })

        client.del(`${userExist._id}`);

        return res.header("Authorization", "").cookie('token', "").cookie('refreshToken', "").status(HttpStatus.OK).send(responser.success({}, "Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali"))
    }

    async changePassword(req, res) {

        const { error } = changePasswordValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const getUserById = await User.findOne({
            _id: req.body.user_id
        })

        if (!getUserById) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.validation("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND))
        }

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.password, salt)
        const validPass = await bcrypt.compare(req.body.old_password, getUserById.password)

        if (!validPass) {
            return res.status(HttpStatus.OK).send(responser.validation("Kata Sandi Lama Tidak Sesuai", HttpStatus.OK))
        }

        if (req.body.password !== req.body.password_confirmation) {
            return res.status(HttpStatus.OK).send(responser.validation("Password Tidak Sesuai", HttpStatus.OK))
        }

        if (req.body.password === req.body.old_password) {
            return res.status(HttpStatus.OK).send(responser.validation("Anda Memasukkan Kata Sandi Yang Sama", HttpStatus.OK))
        }

        try {

            await User.updateOne({
                _id: req.body.user_id
            }, {
                password: newPassword,
                passwordLastUpdate: Date.now()
            }, {
                upsert: true
            })

            const user = await User.findOne({ _id: req.body.user_id })

            user.otpEmail = undefined
            user.otpSms = undefined
            user.password = undefined
            user.addresses = undefined

            res.status(HttpStatus.OK).send(responser.success(user,
                "Kata Sandi Berhasil Di Perbarui",
                HttpStatus.OK))

        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("Tidak Bisa Mengubah Kata Sandi", HttpStatus.BAD_REQUEST)
            );
        }
    }

    async verifyEmailOtp(req, res) {

        const { error } = emailVerify(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        if (req.body.user_id !== req.user.user._id) {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Pengguna Tidak Sesuai Dengan Sesi Login Saat Ini", HttpStatus.UNAUTHORIZED))
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.BAD_REQUEST));
        }

        if (!userExist.active) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
        }

        client.get(`emailOtp.${userExist._id}`, async (err, request) => {

            const user = await User.findOne({ _id: req.body.user_id })

            if (!request) {

                await User.updateOne({
                    _id: user._id
                }, {
                    $set: {
                        "otpEmail.code": 0,
                        "otpEmail.attempts": 0,
                        "otpEmail.expired": true,
                        "otpEmail.expiredDate": Date.now(),

                    }
                }, { upsert: true })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Telah Kadaluarsa", HttpStatus.NOT_ACCEPTABLE));
            }

            if (user['otpEmail']['attempts'] >= 5) {

                await User.updateOne({
                    _id: user._id
                }, {
                    $set: {
                        "otpEmail.code": 0,
                        "otpEmail.attempts": 0,
                        "otpEmail.expired": true,
                        "otpEmail.expiredDate": Date.now(),

                    }
                })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Terlalu Banyak Percobaan, Harap Kirim Ulang Email Verifikasi", HttpStatus.NOT_ACCEPTABLE));

            }

            if (parseInt(req.body.code) !== parseInt(user.otpEmail.code) && user.otpEmail.expired) {

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Verifikasi Gagal, Harap Kirim Ulang Email Verifikasi", HttpStatus.NOT_ACCEPTABLE));

            } else if (parseInt(req.body.code) !== parseInt(user.otpEmail.code)) {

                await User.updateOne({
                    _id: user.id
                }, {
                    $inc: {
                        "otpEmail.attempts": 1

                    }
                })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Verifikasi Salah", HttpStatus.NOT_ACCEPTABLE));

            }

            client.expireat(`emailOtp.${user._id}`, 0);

            await User.updateOne({
                _id: user._id
            }, {
                $set: {
                    "otpEmail.code": 0,
                    "otpEmail.attempts": 0,
                    "otpEmail.expired": true,
                    "otpEmail.expiredDate": Date.now(),
                    "isEmailVerified": true,

                }
            })

            const newUser = await User.findOne({ _id: user._id })

            newUser.password = undefined
            newUser.otpEmail = undefined
            newUser.otpSms = undefined
            newUser.addresses = undefined

            return res.status(HttpStatus.OK).send(responser.success(newUser, "Email Berhasil Diverifikasi"));

        })
    }

    async resendVerifyEmail(req, res) {

        const { error } = resendEmailVerify(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        let isValid = this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("ID Pengguna Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const userExist = await User.findOne({ _id: req.body.user_id })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Terdaftar", HttpStatus.NOT_FOUND));
        }
        if (userExist.isEmailVerified) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Email Telah Diverifikasi", HttpStatus.NOT_FOUND));
        }

        if (!userExist.active) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
        }

        const otp = nanoid();

        let expiredTime = 1200000 //20 minutes on milliseconds
        let expired = date.time(expiredTime, 'milliseconds')

        await User.updateOne({
            email: userExist.email
        }, {
            $set: {
                "otpEmail.code": otp,
                "otpEmail.attempts": 0,
                "otpEmail.expired": false,
                "otpEmail.expiredDate": expired,

            }
        }, { upsert: true })

        SendVerifyEmail.send({
            to: userExist.email,
            subject: "Verifikasi Email Anda | PT. BELI AYAM COM",
            text: `Kode Verifikasi Email Anda Adalah ${otp}`,
            name: userExist.name ?? "",
            otp: otp
        })

        client.set(`emailOtp.${userExist._id}`, JSON.stringify(otp), 'EX', expiredTime);

        res.status(HttpStatus.OK).send(responser.success({
            email: userExist.email,
            otpExpired: expired
        },
            `Email Verifikasi Telah Dikirim Ke Alamat Email ${userExist.email}`,
            HttpStatus.OK))

    }

    async getOrders(req, res) {

        let page = parseInt(req.query.page) ?? 1
        let show = parseInt(req.query.show) ?? 10

        let sortBy;
        let orderBy = 1;

        if (req.query.sortBy) {
            sortBy = req.query.sortBy === "ASC" ? 1 : -1
        }

        if (!req.query.orderBy) {
            orderBy = req.query.orderBy === "payment_date" ? 1 : -1
        }

        orderBy = req.query.orderBy ?? 1

        let query = {
            $match: {}
        }

        let sort = {
            $sort: {}
        }

        if (req.query.status) {

            const isPaymentStatusExist = await this.checkPaymentStatusCode(parseInt(req.query.status))

            if (isPaymentStatusExist.length <= 0) {

                return res.status(HttpStatus.NOT_FOUND).send(
                    responser.error(translate('payment.unknow_payment'), HttpStatus.NOT_FOUND)
                );
            }

            query.$match['payment.payment_status_code'] = {
                $eq: parseInt(req.query.status)
            }
        }

        if (req.query.fromDate) {

            query.$match['order_status.'.concat(orderBy)] = {
                $gte: date.format(req.query.fromDate).toDate() ?? date.endOf(), $lte: date.format(req.query.toDate).toDate() ?? date.beginOf()
            }
        }

        sort.$sort[orderBy] = sortBy

        try {

            let user = await OrderModel.aggregate([
                query, sort,
                { $skip: (page - 1) * show },
                { $limit: show }
            ])

            return res.status(HttpStatus.OK).send(responser.success(user, "OK"));
        } catch (err) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Invalid Format", HttpStatus.NOT_FOUND));
        }
    }

    async checkPaymentStatusCode(payment_status_code_response) {

        return Object.keys(paymentStatus).filter((key) => payment_status_code_response === paymentStatus[key].code)

    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }
}

module.exports = new UserController
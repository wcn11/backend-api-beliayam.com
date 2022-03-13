const mongoose = require('mongoose');
const User = require('@model/user/user.model')
const bcrypt = require('bcryptjs')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const SMSGateway = require('@service/SMS.gateway')
const SendVerifyEmail = require('@mailService/SendVerifyEmail.mail')
const SendGreeting = require('@mailService/SendGreeting.mail')
const SendForgetPassword = require('@mailService/SendForgetPassword.mail')
const date = require('@helper/date')
const jwt = require('@helper/jwt')
const { v4: uuidv4 } = require('uuid');

const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890', 4) // NO LETTER 

const redis = require("redis");

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const crypto = require('crypto');

// const PusherNotification = require('@service/PushNotification')
const moment = require('moment')
moment.locale('id-ID');

const {
    loginValidator,
    loginByPhoneValidator,
    registerValidator,
    emailVerify,
    registerByPhoneValidator,
    resendEmailVerify,
    resendPhoneVerify,
    verifyPhoneByUserOTPValidator,
    refreshTokenValidator,
    loginBySocialValidator,
    changePasswordValidator,
    resendSmsOtpRegisterValidator,
    verifySmsOtpRegisterValidator,
    sendOtpForgetPasswordValidator,
    sendEmailForgetPasswordValidator,
    verifyLinkForgetPasswordValidator,
} = require('@validation/auth/auth.validation')

const AuthController = class AuthController {

    async register(req, res) {

        const { error } = registerValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const emailExist = await User.findOne({ email: req.body.email })

        if (emailExist) return res.status(HttpStatus.OK).send(responser.error("Email Telah Terdaftar", HttpStatus.OK))

        const salt = await bcrypt.genSalt(10);

        const otp = nanoid();

        //20 minutes on milliseconds
        let expiredTime = 1200000
        let expired = moment().add(expiredTime, 'milliseconds')

        let registeredBy = req.body.registerBy
        let registerAt = req.body.registerAt

        try {

            let setPassword = await bcrypt.hash(req.body.password, salt)

            const userObject = new User({
                name: req.body.name,
                email: req.body.email,
                password: setPassword,
                registeredBy: registeredBy,
                registeredAt: registerAt,
                otpEmail: {
                    code: otp,
                    expired: false,
                    expiredDate: expired
                }
            })

            const savedUsers = await userObject.save()

            // SendVerifyEmail.send({
            //     to: savedUsers.email,
            //     subject: "Verifikasi Email Anda | Beliayam.com",
            //     text: `Kode Verifikasi Email Anda Adalah ${otp}`,
            //     name: req.body.name,
            //     code: otp
            // })
            SendGreeting.send({
                to: savedUsers.email,
                subject: `Selamat Datang, ${req.body.name} | Beliayam.com`,
                name: req.body.name
            })

            // client.set(`emailOtp.${savedUsers._id}`, JSON.stringify(otp), 'EX', expiredTime);

            let user = await User.findOne({ email: req.body.email })

            user.password = undefined

            const loggedUser = {
                user
            }

            const token = jwt.sign(loggedUser, user._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache(user._id, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedUser['token'] = tokenList

            return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK)
                .send(responser.success(
                    loggedUser,
                    "Akun Dibuat, Segera Verifikasi Email Anda",
                    "OK"));

        } catch (err) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Sementara Waktu Tidak Dapat Mendaftar", HttpStatus.INTERNAL_SERVER_ERROR))
        }
    }

    async registerByPhone(req, res) {

        const { error } = registerByPhoneValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isPhoneExist = await User.findOne({ phone: req.body.phone })

        if (isPhoneExist && !isPhoneExist.isPhoneVerified) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Telah Terdaftar Namun Belum Diverifikasi, Harap Verifikasi Untuk Melanjutkan", HttpStatus.OK)
            );
        } else if (isPhoneExist && isPhoneExist.isPhoneVerified) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Telah Terdaftar", HttpStatus.OK)
            );
        }

        const salt = await bcrypt.genSalt(10);

        let registeredBy = req.body.registerBy // ?? 'phone'
        let registerAt = req.body.registerAt //?? 'website'

        try {

            let setPassword = await bcrypt.hash(req.body.password, salt)

            const otp = nanoid();

            //5 minutes on seconds
            let expiredTime = 300
            let expired = moment().add(expiredTime, 'seconds')

            const userObject = new User({
                phone: req.body.phone,
                isPhoneVerified: false,
                password: setPassword,
                registeredBy: registeredBy,
                registeredAt: registerAt,
                otpSms: {
                    code: otp,
                    attempts: 0,
                    expiredDate: expired,
                    expired: false
                }
            })

            await userObject.save()

            SMSGateway.sendSms({
                to: req.body.phone,
                text: `Masukan Kode OTP: ${otp} ini pada aplikasi beliayamcom. JANGAN MEMBERIKAN KODE KEPADA SIAPAPUN TERMASUK PIHAK BELIAYAMCOM`

            });

            client.set(`smsOtp.${req.body.phone}`, JSON.stringify(otp), 'EX', expiredTime);

            return res.status(HttpStatus.OK).send(
                responser.success(
                    {
                        otpSms: {
                            expiredDate: expired,
                            expired: false
                        }
                    }, `Kode OTP Telah Dikirm Ke Nomor ${req.body.phone}, Harap Cek Telepon Anda`)
            );

        } catch (err) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Sementara Waktu Tidak Dapat Mendaftar", HttpStatus.INTERNAL_SERVER_ERROR))
        }
    }

    async login(req, res) {

        const { error } = loginValidator(req.body)

        if (error) {

            return res.status(HttpStatus.OK).send(responser.error(error.details[0].message, HttpStatus.OK));
        }

        let user = await User.findOne({ email: req.body.email })

        if (!user) return res.status(HttpStatus.OK).send(responser.error("Email Atau Kata Sandi Salah", HttpStatus.OK));

        const validPass = await bcrypt.compare(req.body.password, user.password)

        if (!validPass) return res.status(HttpStatus.OK).send(responser.error("Email Atau Kata Sandi Salah", HttpStatus.OK));

        if (!user.isActive) {
            return res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        user.password = undefined
        user.otpEmail = undefined
        user.otpSms = undefined
        user.addresses = undefined

        const loggedUser = {
            user
        }

        const token = jwt.sign(loggedUser, user._id)

        const refreshToken = uuidv4().toUpperCase()

        jwt.setCache(user._id, token, refreshToken)

        const tokenList = {

            "accessToken": token,
            "refreshToken": refreshToken
        }

        loggedUser['token'] = tokenList

        return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK).send(responser.success(loggedUser, "OK"));

    }

    async loginBySocial(req, res) {

        const { error } = loginBySocialValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const user = await User.findOne({ email: req.body.email })

        if (user) {

            if (!user.isActive) {
                res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
            }
            if (user.registeredBy !== req.body.loginBy) {
                res.status(HttpStatus.OK).send(responser.error(`Email telah terdaftar dengan ${user.registerBy}, harap login dengan metode ${user.registerBy}`, HttpStatus.OK));
            }
        }

        if (!user) {

            const userObject = new User({
                name: req.body.name,
                email: req.body.email,
                registeredBy: req.body.loginBy,
                registeredAt: req.body.loginAt,
                isEmailVerified: true
            })

            await userObject.save()


            SendGreeting.send({
                to: req.body.email,
                subject: `Selamat Datang, ${req.body.name} | Beliayam.com`,
                name: req.body.name
            })
        }

        user.password = undefined || null
        user.otpEmail = undefined
        user.otpSms = undefined
        user.addresses = undefined || null

        const loggedUser = {
            user
        }

        const token = jwt.sign(loggedUser, user._id)

        const refreshToken = uuidv4().toUpperCase()

        jwt.setCache(user._id, token, refreshToken)

        const tokenList = {

            "accessToken": token,
            "refreshToken": refreshToken
        }

        loggedUser['token'] = tokenList

        return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK)
            .send(responser.success(
                loggedUser,
                "OK"));

        // } catch (err) {
        //     res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error("Tidak Bisa Mendaftar", HttpStatus.INTERNAL_SERVER_ERROR))

        // }
    }

    async loginByPhone(req, res) {

        const { error } = loginByPhoneValidator(req.body)

        if (error) {
            return res.status(400).send(error.details[0].message)
        }

        const user = await User.findOne({ phone: req.body.phone, isPhoneVerified: true })

        if (!user) {

            return res.status(HttpStatus.OK).send(
                responser.error("Telepon Atau Password Salah", HttpStatus.OK)
            );
        }

        const validPass = await bcrypt.compare(req.body.password, user.password)

        if (!validPass) {

            return res.status(HttpStatus.OK).send(
                responser.error("Telepon Atau Password Salah", HttpStatus.OK)
            );
        }

        if (!user.isActive) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
        }

        user.otpEmail = undefined
        user.otpSms = undefined
        user.password = undefined
        user.addresses = undefined

        const loggedUser = {
            user
        }

        const token = jwt.sign(loggedUser, user._id)

        const refreshToken = uuidv4().toUpperCase()

        jwt.setCache(user._id, token, refreshToken)

        const tokenList = {

            "accessToken": token,
            "refreshToken": refreshToken
        }

        loggedUser['token'] = tokenList

        return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK).send(responser.success(loggedUser), "OK", HttpStatus.OK)
    }

    async verifySmsOtpRegister(req, res) {

        const { error } = verifySmsOtpRegisterValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isPhoneExist = await User.findOne({ phone: req.body.phone })

        if (isPhoneExist && isPhoneExist.isPhoneVerified) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Telah Terdaftar", HttpStatus.OK)
            );
        } else if (isPhoneExist && !isPhoneExist.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        client.get(`smsOtp.${req.body.phone}`, async (err, request) => {

            if (!request) {

                await User.updateOne({
                    phone: req.body.phone
                }, {
                    $set: {
                        "otpSms.code": 0,
                        "otpSms.attempts": 0,
                        "otpSms.expired": true,
                        "otpSms.expiredDate": Date.now(),

                    }
                }, { upsert: true })

                return res.status(HttpStatus.OK).send(responser.error("Kode Telah Kadaluarsa, Kirim Ulang OTP", HttpStatus.OK));
            }

            const user = await User.findOne({ phone: req.body.phone })

            if (user['otpSms']['attempts'] >= 5) {

                await User.updateOne({
                    phone: req.body.phone
                }, {
                    $set: {
                        "otpSms.code": 0,
                        "otpSms.attempts": 0,
                        "otpSms.expired": true,
                        "otpSms.expiredDate": Date.now(),

                    }
                })

                return res.status(HttpStatus.OK).send(responser.error("Terlalu Banyak Percobaan, Harap Kirim Ulang SMS Verifikasi", HttpStatus.OK));

            }

            if (parseInt(req.body.code) !== parseInt(user.otpSms.code) && user.otpSms.expired) {

                return res.status(HttpStatus.OK).send(responser.error("Verifikasi Gagal, Harap Kirim Ulang SMS Verifikasi", HttpStatus.OK));

            } else if (parseInt(req.body.code) !== parseInt(user.otpSms.code)) {

                await User.updateOne({
                    _id: user._id
                }, {
                    $inc: {
                        "otpSms.attempts": 1
                    }
                })

                return res.status(HttpStatus.OK).send(responser.error("Kode Verifikasi Salah", HttpStatus.OK));

            }

            await User.updateOne({
                phone: req.body.phone
            }, {
                $set: {
                    "otpSms.code": 0,
                    "otpSms.attempts": 0,
                    "otpSms.expired": true,
                    "otpSms.expiredDate": Date.now(),
                    "isPhoneVerified": true,

                }
            }, { upsert: true })

            client.expireat(`smsOtp.${req.body.phone}`, 0);

            const UserData = await User.findOne({ phone: req.body.phone })

            UserData.otpEmail = undefined
            UserData.otpSms = undefined
            UserData.password = undefined
            UserData.addresses = undefined

            const loggedUser = {
                user: UserData
            }

            const token = jwt.sign(loggedUser, user._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache(user._id, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedUser['token'] = tokenList

            return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK).send(responser.success(loggedUser, "Berhasil Diverifikasi"));
        })

    }

    async verifySmsOtpForgetPassword(req, res) {

        const { error } = verifySmsOtpRegisterValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const isPhoneExist = await User.findOne({ phone: req.body.phone })

        if (isPhoneExist && !isPhoneExist.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        client.get(`smsOtpForgetPassword.${req.body.phone}`, async (err, request) => {

            if (!request) {

                await User.updateOne({
                    phone: req.body.phone
                }, {
                    $set: {
                        isPhoneVerified: true,
                        "otpSms.code": 0,
                        "otpSms.attempts": 0,
                        "otpSms.expired": true,
                        "otpSms.expiredDate": Date.now(),

                    }
                }, { upsert: true })

                return res.status(HttpStatus.OK).send(responser.error("Kode Telah Kadaluarsa, Kirim Ulang OTP", HttpStatus.OK));
            }

            const user = await User.findOne({ phone: req.body.phone })

            if (user['otpSms']['attempts'] >= 5) {

                await User.updateOne({
                    phone: req.body.phone
                }, {
                    $set: {
                        "otpSms.code": 0,
                        "otpSms.attempts": 0,
                        "otpSms.expired": true,
                        "otpSms.expiredDate": Date.now(),

                    }
                })

                return res.status(HttpStatus.OK).send(responser.error("Terlalu Banyak Percobaan, Harap Kirim Ulang SMS Verifikasi", HttpStatus.OK));

            }

            if (parseInt(req.body.code) !== parseInt(user.otpSms.code) && user.otpSms.expired) {

                return res.status(HttpStatus.OK).send(responser.error("Verifikasi Gagal, Harap Kirim Ulang SMS Verifikasi", HttpStatus.OK));

            } else if (parseInt(req.body.code) !== parseInt(user.otpSms.code)) {

                await User.updateOne({
                    _id: user._id
                }, {
                    $inc: {
                        "otpSms.attempts": 1
                    }
                })

                return res.status(HttpStatus.OK).send(responser.error("Kode Verifikasi Salah", HttpStatus.OK));

            }

            await User.updateOne({
                phone: req.body.phone
            }, {
                $set: {
                    "otpSms.code": 0,
                    "otpSms.attempts": 0,
                    "otpSms.expired": true,
                    "otpSms.expiredDate": Date.now(),
                    "isPhoneVerified": true,

                }
            }, { upsert: true })

            client.expireat(`smsOtpForgetPassword.${req.body.phone}`, 0);

            const UserData = await User.findOne({ phone: req.body.phone })

            UserData.otpEmail = undefined
            UserData.otpSms = undefined
            UserData.password = undefined
            UserData.addresses = undefined

            const loggedUser = {
                user: UserData
            }

            const token = jwt.sign(loggedUser, user._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache(user._id, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedUser['token'] = tokenList

            return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK).send(responser.success(loggedUser, "Berhasil Diverifikasi"));
        })

    }

    async resendSmsOtpRegister(req, res) {

        const { error } = resendSmsOtpRegisterValidator(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const isPhoneExist = await User.findOne({ phone: req.body.phone })

        if (!isPhoneExist) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Tidak Terdaftar, Harap Mendaftar Terlebih Dahulu", HttpStatus.OK)
            );
        }

        if (isPhoneExist && isPhoneExist.isPhoneVerified) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Telah Terdaftar", HttpStatus.OK)
            );
        }

        if (!isPhoneExist.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        const otp = nanoid();

        SMSGateway.sendSms({
            to: req.body.phone,
            text: `Masukan Kode text: ${otp} ini pada aplikasi beliayamcom. JANGAN MEMBERIKAN KODE KEPADA SIAPAPUN TERMASUK PIHAK BELIAYAMCOM`

        });

        //5 minutes on seconds
        let expiredTime = 300
        let expired = moment().add(expiredTime, 'seconds')

        await User.updateOne({
            phone: req.body.phone,
        }, {
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

        client.set(`smsOtp.${req.body.phone}`, JSON.stringify(otp), 'EX', expiredTime);

        return res.status(HttpStatus.OK).send(
            responser.success(
                {
                    otpSms: {
                        expiredDate: expired,
                        expired: false
                    }
                }, `Kode OTP Telah Dikirm Ke Nomor ${req.body.phone}, Harap Cek Telepon Anda`)
        );

    }


    async resendSmsOtpForgetPassword(req, res) {

        const { error } = resendSmsOtpRegisterValidator(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const isPhoneExist = await User.findOne({ phone: req.body.phone })

        if (!isPhoneExist) {
            return res.status(HttpStatus.OK).send(
                responser.error("Nomor Tidak Terdaftar, Harap Mendaftar Terlebih Dahulu", HttpStatus.OK)
            );
        }

        if (!isPhoneExist.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        const otp = nanoid();

        SMSGateway.sendSms({
            to: req.body.phone,
            text: `Masukan Kode text: ${otp} ini pada aplikasi beliayamcom. JANGAN MEMBERIKAN KODE KEPADA SIAPAPUN TERMASUK PIHAK BELIAYAMCOM`

        });

        //5 minutes on seconds
        let expiredTime = 300
        let expired = date.time(expiredTime, 'seconds')

        await User.updateOne({
            phone: req.body.phone,
        }, {
            otpSms: {
                code: otp,
                attempts: 0,
                expiredDate: expired,
                expired: false
            }
        }, {
            upsert: true
        })

        client.set(`smsOtpForgetPassword.${req.body.phone}`, JSON.stringify(otp), 'EX', expiredTime);

        return res.status(HttpStatus.OK).send(
            responser.success(
                {
                    otpSms: {
                        expiredDate: expired,
                        expired: false
                    }
                }, `Kode OTP Telah Dikirm Ke Nomor ${req.body.phone}, Harap Cek Telepon Anda`)
        );

    }

    async verifyPhoneByUserId(req, res) {

        const { error } = verifyPhoneByUserOTPValidator(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.OK).send(
                responser.error("User ID Tidak Valid", HttpStatus.OK)
            );
        }

        const user = await User.findOne({ _id: req.body.user_id })

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
        }

        if (!user.isActive) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
        }

        client.get(`smsOtp.${user.id}`, async (err, request) => {

            if (!request) {

                await User.updateOne({
                    _id: user.id
                }, {
                    $set: {
                        "otpSms.code": 0,
                        "otpSms.attempts": 0,
                        "otpSms.expired": true,
                        "otpSms.expiredDate": Date.now(),

                    }
                }, { upsert: true })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Telah Kadaluarsa, Kirim Ulang OTP", HttpStatus.NOT_ACCEPTABLE));
            }

            if (user['otpSms']['attempts'] >= 5) {

                await User.updateOne({
                    _id: user.id
                }, {
                    $set: {
                        "otpSms.code": 0,
                        "otpSms.attempts": 0,
                        "otpSms.expired": true,
                        "otpSms.expiredDate": Date.now(),

                    }
                })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Terlalu Banyak Percobaan, Harap Kirim Ulang SMS Verifikasi", HttpStatus.NOT_ACCEPTABLE));

            }

            if (parseInt(req.body.code) !== parseInt(user.otpSms.code) && user.otpSms.expired) {

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Verifikasi Gagal, Harap Kirim Ulang SMS Verifikasi", HttpStatus.NOT_ACCEPTABLE));

            } else if (parseInt(req.body.code) !== parseInt(user.otpSms.code)) {

                await User.updateOne({
                    _id: user.id
                }, {
                    $inc: {
                        "otpSms.attempts": 1

                    }
                })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Verifikasi Salah", HttpStatus.NOT_ACCEPTABLE));

            }

        })

        await User.updateOne({
            _id: user.id
        }, {
            $set: {
                "otpSms.code": 0,
                "otpSms.attempts": 0,
                "otpSms.expired": true,
                "otpSms.expiredDate": Date.now(),
                "isPhoneVerified": true,

            }
        })

        return res.status(HttpStatus.OK).send(responser.success({}, "Nomor Telepon Berhasil Diverifikasi"));

    }

    async resendOtpVerifyPhone(req, res) {

        const { error } = resendPhoneVerify(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        let isValid = await this.isIdValid(req.body.user_id)

        if (!isValid) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
            );
        }

        const user = await User.findOne({ _id: req.body.user_id })

        if (!user) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("User ID Tidak Terdaftar", HttpStatus.NOT_FOUND));
        }

        if (user.isPhoneVerified) {
            return res.status(HttpStatus.OK).send(responser.error("Tidak Bisa Mem-verifikasi Ulang Nomor Yang Telah Terverifikasi Sebelumnya", HttpStatus.OK));
        }

        if (!user.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        const otp = nanoid();

        let sendSms = SMSGateway.sendSms({
            to: req.body.phone,
            text: `Masukan Kode text: ${otp} ini pada aplikasi beliayamcom. JANGAN MEMBERIKAN KODE KEPADA SIAPAPUN TERMASUK PIHAK BELIAYAMCOM`

        });

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

        client.set(`smsOtp.${req.body.user_id}`, JSON.stringify(otp), 'EX', expiredTime);

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

    async verifyEmailOtp(req, res) {

        const { error } = emailVerify(req.body)

        if (error) {
            return res.status(HttpStatus.OK).send(responser.validation(error.details[0].message, HttpStatus.OK))
        }

        const userExist = await User.findOne({ email: req.body.email })

        if (!userExist) {
            return res.status(HttpStatus.OK).send(responser.error("Email Atau Kode Verifikasi Salah", HttpStatus.OK));
        }

        if (!userExist.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        client.get(`emailOtp.${userExist.id}`, async (err, request) => {

            const user = await User.findOne({ email: req.body.email })

            if (!request) {

                await User.updateOne({
                    _id: user.id
                }, {
                    $set: {
                        "otpEmail.code": 0,
                        "otpEmail.attempts": 0,
                        "otpEmail.expired": true,
                        "otpEmail.expiredDate": Date.now(),

                    }
                }, { upsert: true })

                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Telah Kadaluarsa, Kirim Ulang OTP", HttpStatus.NOT_ACCEPTABLE));
            }

            if (user['otpEmail']['attempts'] >= 5) {

                await User.updateOne({
                    _id: user.id
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
                _id: user.id
            }, {
                $set: {
                    "otpEmail.code": 0,
                    "otpEmail.attempts": 0,
                    "otpEmail.expired": true,
                    "otpEmail.expiredDate": Date.now(),
                    "isEmailVerified": true,

                }
            })

            const newUser = await User.findOne({ _id: user.id })

            newUser.password = undefined
            newUser.otpEmail = undefined
            newUser.otpSms = undefined
            newUser.addresses = undefined

            return res.status(HttpStatus.OK).send(responser.success({ user: newUser }));

        })
    }

    async resendVerifyEmail(req, res) {

        const { error } = resendEmailVerify(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const userExist = await User.findOne({ email: req.body.email })

        if (!userExist) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Email Tidak Terdaftar", HttpStatus.NOT_FOUND));
        }

        if (userExist.isEmailVerified) {
            return res.status(HttpStatus.NOT_FOUND).send(responser.error("Email Telah Diverifikasi", HttpStatus.NOT_FOUND));
        }

        if (!userExist.isActive) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
        }

        const otp = nanoid();

        let expiredTime = 1200000 //20 minutes on milliseconds
        let expired = moment().add(expiredTime, 'milliseconds')

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
            subject: "Verifikasi Email | Beliayam.com",
            otp: otp,
            name: userExist.name ?? ""
        })

        client.set(`emailOtp.${userExist._id}`, JSON.stringify(otp), 'EX', expiredTime);

        res.status(HttpStatus.OK).send(responser.success({
            email: userExist.email,
            otpExpired: expired
        },
            `Email Verifikasi Telah Dikirim Ke Alamat Email ${userExist.email}`,
            HttpStatus.OK))

    }

    async sendEmailForgetPassword(req, res) {

        const { error } = sendEmailForgetPasswordValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const userExist = await User.findOne({ email: req.body.email })

        if (!userExist) {
            return res.status(HttpStatus.OK).send(responser.error("Email Tidak Terdaftar", HttpStatus.OK));
        }

        if (!userExist.isActive) {
            res.status(HttpStatus.OK).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.OK));
        }

        const token = crypto.randomBytes(32).toString("hex")

        const signature = crypto.createHmac('sha1', process.env.SIGNATURE_SECRET)
            .digest('hex')

        client.set(`reset-password.${userExist._id}`, JSON.stringify({
            token: token,
            signature: signature
        }), 'EX', process.env.SIGNATURE_TTL);

        const link = `${process.env.CLIENT_URL}/recover/reset-password?token=${token}&id=${userExist._id}&signature=${signature}`

        SendForgetPassword.send({
            to: userExist.email,
            subject: "Reset Password | Beliayam.com",
            text: `Reset Kata Sandi Anda Dengan Klik Tombol Dibawah`,
            link,
        })

        res.status(HttpStatus.OK).send(responser.success({
            email: userExist.email
        },
            `Link Untuk Me-Reset Kata Sandi Anda Telah Dikirim Ke Alamat Email ${userExist.email}`,
            HttpStatus.OK))
    }

    async sendOtpForgetPassword(req, res) {

        const { error } = sendOtpForgetPasswordValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(
                responser.error(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const user = await User.findOne({ phone: req.body.phone })

        if (!user) {
            return res.status(HttpStatus.OK).send(
                responser.error("No. Telepon Belum Terdaftar", HttpStatus.OK)
            );
        }
        var otp = parseInt(Math.random() * 10000);

        // SMSGateway.sendSms({
        //     to: req.body.phone,
        //     text: `Kode reset password OTP: ${otp}. JANGAN MEMBERIKAN KODE KEPADA SIAPAPUN TERMASUK PIHAK BELIAYAMCOM`

        // });

        //5 minutes on milliseconds
        let expiredTime = 300000
        let expired = date.time(expiredTime, 'milliseconds')

        await User.updateOne({
            _id: user._id
        }, {
            otpSms: {
                code: otp,
                attempts: 0,
                expiredDate: expired,
                expired: false
            }
        }, {
            upsert: true
        })

        client.setex(`smsOtp.${user._id}`, expiredTime, JSON.stringify(otp));

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

    async verifyLinkForgetPassword(req, res) {

        const { error } = verifyLinkForgetPasswordValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        client.get(`reset-password.${req.body.id}`, async (err, data) => {
            if (err) {
                return res.status(HttpStatus.CONFLICT).send(responser.error(err, HttpStatus.CONFLICT));
            }

            if (!data) {
                return res.status(HttpStatus.FORBIDDEN).send(responser.error("Link Kadaluarsa", HttpStatus.FORBIDDEN));
            }

            const payload = JSON.parse(data)

            if (payload.token !== req.body.token) {
                return res.status(HttpStatus.FORBIDDEN).send(responser.error("Invalid Token Signature", HttpStatus.FORBIDDEN));
            }

            if (payload.signature !== req.body.signature) {
                return res.status(HttpStatus.FORBIDDEN).send(responser.error("Invalid Signature", HttpStatus.FORBIDDEN));
            }

            const getUserById = await User.findOne({
                _id: req.body.id
            })

            if (!getUserById) {
                return res.status(HttpStatus.FORBIDDEN).send(responser.error("Akun Tidak Ditemukan", HttpStatus.FORBIDDEN));
            }

            if (!getUserById.isActive) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
            }

            // client.expireat(`smsOtp.${req.body.phone}`, 0);

            res.status(HttpStatus.OK).send(responser.success(getUserById, "OK", HttpStatus.OK))
        })

    }

    async changePassword(req, res) {

        const { error } = changePasswordValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!req.header('signature')) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Signature Not Provided", HttpStatus.BAD_REQUEST))
        }

        if (req.body.password !== req.body.password_confirmation) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation("Password Tidak Sesuai", HttpStatus.BAD_REQUEST))
        }

        client.get(`reset-password.${req.body._id}`, async (err, data) => {

            if (err) {
                return res.status(HttpStatus.CONFLICT).send(responser.error(err, HttpStatus.CONFLICT));
            }

            if (!data) {
                return res.status(HttpStatus.FORBIDDEN).send(responser.error("Link Kadaluarsa", HttpStatus.FORBIDDEN));
            }

            const payload = JSON.parse(data)

            if (payload.signature !== req.header('signature')) {
                return res.status(HttpStatus.FORBIDDEN).send(responser.error("Invalid Signature", HttpStatus.FORBIDDEN));
            }

            const salt = await bcrypt.genSalt(10);
            const newPassword = await bcrypt.hash(req.body.password, salt)

            try {

                const getUserById = await User.findOne({
                    _id: req.body._id
                })

                if (!getUserById) {
                    return res.status(HttpStatus.FORBIDDEN).send(responser.error("Akun Tidak Ditemukan", HttpStatus.FORBIDDEN));
                }

                if (!getUserById.isActive) {
                    res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan, Harap Hubungi Administrator Untuk Mengaktifkan Kembali", HttpStatus.BAD_REQUEST));
                }

                await User.updateOne({
                    _id: req.body._id
                }, {
                    password: newPassword,
                    passwordLastUpdate: Date.now()
                }, {
                    upsert: true
                })

                const user = await User.findOne({ _id: req.body._id })

                user.otpEmail = undefined
                user.otpSms = undefined
                user.password = undefined
                user.addresses = undefined

                const loggedUser = {
                    user
                }

                const token = jwt.sign(loggedUser, user._id)

                const refreshToken = uuidv4().toUpperCase()

                jwt.setCache(user._id, token, refreshToken)

                const tokenList = {

                    "accessToken": token,
                    "refreshToken": refreshToken
                }

                loggedUser['token'] = tokenList

                client.del(`reset-password.${req.body._id}`);

                return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK).send(responser.success(loggedUser, "Kata Sandi Berhasil Di Perbarui", HttpStatus.OK))

            } catch (err) {
                return res.status(HttpStatus.BAD_REQUEST).send(
                    responser.error("Tidak Bisa Mengubah Kata Sandi", HttpStatus.BAD_REQUEST)
                );
            }
        })
    }

    // async changePassword(req, res) {

    //     const { error } = changePassword(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     let isValid = await this.isIdValid(req.body.user_id)

    //     if (!isValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
    //         );
    //     }

    //     const userExist = await User.findOne({ _id: req.body.user_id })

    //     if (!userExist) {
    //         return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
    //     }

    //     const validPass = await bcrypt.compare(req.body.old_password, userExist.password)

    //     if (!validPass) return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kata Sandi Salah", HttpStatus.NOT_ACCEPTABLE))

    //     const salt = await bcrypt.genSalt(10);
    //     const newPassword = await bcrypt.hash(req.body.new_password, salt)


    //     try {
    //         const user = await User.updateOne({
    //             _id: req.body.user_id
    //         }, {
    //             password: newPassword,
    //             passwordLastUpdate: Date.now()
    //         }, {
    //             upsert: true
    //         })

    //         res.status(HttpStatus.OK).send(responser.success([],
    //             "Kata Sandi Berhasil Di Perbarui",
    //             HttpStatus.OK))
    //     } catch (err) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("Tidak Bisa Mengubah Kata Sandi", HttpStatus.BAD_REQUEST)
    //         );
    //     }

    // }

    async refreshToken(req, res) {

        const { error } = refreshTokenValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!req.header('Authorization')) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Token Not Provided", HttpStatus.UNAUTHORIZED))

        const token = req.header('Authorization').split(" ")[1]

        if (!token) return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Token Not Provided", HttpStatus.UNAUTHORIZED))

        const decode = jwt.decode(token);

        if (!decode) {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Token", HttpStatus.UNAUTHORIZED))
        }

        client.get(`${decode.aud}`, async (err, request) => {

            if (err) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(responser.error(err, HttpStatus.INTERNAL_SERVER_ERROR))
            }

            if (!request) {
                return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Refresh Token", HttpStatus.UNAUTHORIZED))
            }

            const payload = JSON.parse(request)

            if (token !== payload.token) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Token Not Match", HttpStatus.BAD_REQUEST))
            }

            if (req.body.refreshToken.toUpperCase() !== payload.refreshToken.toUpperCase()) {
                return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Refresh Token Not Match", HttpStatus.BAD_REQUEST))
            }

            try {

                const user = await User.findOne({ _id: decode.aud })

                if (!user) {
                    return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Payload Refresh Token", HttpStatus.UNAUTHORIZED))
                }

                user.otpEmail = undefined
                user.otpSms = undefined
                user.password = undefined
                user.addresses = undefined

                const loggedUser = {
                    user
                }

                const token = jwt.sign(loggedUser, user._id)

                const refreshToken = uuidv4().toUpperCase()

                jwt.setCache(user._id, token, refreshToken)

                const tokenList = {

                    "accessToken": token,
                    "refreshToken": refreshToken
                }

                loggedUser['token'] = tokenList

                return res.status(HttpStatus.OK).send(responser.success(loggedUser, "OK", HttpStatus.OK))

            } catch (err) {
                console.error(err)
                return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Session Expired", HttpStatus.UNAUTHORIZED))
            }
        })
    }

    async logout(req, res) {

        const token = req.header('Authorization').split(" ")[1]

        if (!token) {
            return res.header("Authorization", "").cookie('token', "").cookie('refreshToken', "").status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))
        }

        const decodedToken = jwt.decode(token);

        if (!decodedToken) {
            return res.header("Authorization", "").cookie('token', "").cookie('refreshToken', "").status(HttpStatus.UNAUTHORIZED).send(responser.error("Unauthorized", HttpStatus.UNAUTHORIZED))
        }

        client.del(decodedToken.aud);

        return res.header("Authorization", "").cookie('token', "").cookie('refreshToken', "").status(HttpStatus.OK).send(responser.success([], "Anda Telah Logout", HttpStatus.OK))
    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

}

module.exports = new AuthController
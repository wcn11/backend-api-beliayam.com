const mongoose = require('mongoose');
const AdminModel = require('@model/admin/admin.model')
const bcrypt = require('bcryptjs')
const jwt = require('@helper/jwtAdmin')
const HttpStatus = require('@helper/http_status')
const responser = require('@responser')
const customId = require("custom-id");
const { v4: uuidv4 } = require('uuid');
// const SMSGateway = require('@service/SMS.gateway')
// const SendVerifyEmail = require('@mailService/SendVerifyEmail.mail')
// const SendForgetPassword = require('@mailService/SendForgetPassword.mail')

// const PusherNotification = require('@service/PushNotification')
const moment = require('moment')

const redis = require("@config/redis");

const {
    loginValidator,
    byPhone,
    registerValidator,
    emailVerify,
    registerByPhone,
    resendEmailVerify,
    resendPhoneVerify,
    verifyPhoneByUserOTPValidator,
    refreshTokenValidator,
    loginBySocialValidator,
    changePasswordValidator,
    resendSmsOtpRegisterValidator,
    verifySmsOtpRegisterValidator,
    sendEmailForgetPasswordValidator,
    verifyLinkForgetPasswordValidator,
} = require('@validation/admin/auth/auth.validation')

const AdminController = class AdminController {

    async register(req, res) {

        const { error } = registerValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        const emailExist = await AdminModel.findOne({ email: req.body.email })

        if (emailExist) return res.status(HttpStatus.OK).send(responser.error(translate('admin.register.email_exist'), HttpStatus.OK))

        const usernameExist = await AdminModel.findOne({ username: req.body.username })

        if (usernameExist) return res.status(HttpStatus.OK).send(responser.error(translate('admin.register.username_exist'), HttpStatus.OK))

        const salt = await bcrypt.genSalt(10);

        try {

            let setPassword = await bcrypt.hash(req.body.password, salt)

            req.body.password = setPassword

            let adminObject = req.body

            if (req.body.roleId !== NaN) {
                adminObject.role = {
                    roleId: req.body.roleId ?? 1
                }
            }

            const adminData = new AdminModel(
                adminObject
            )

            await adminData.save()

            let admin = await AdminModel.findOne({ email: req.body.email })

            admin.password = undefined

            const loggedAdmin = {
                admin
            }

            const token = jwt.sign(loggedAdmin, admin._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache('admin.' + admin._id, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedAdmin['token'] = tokenList

            return res.header("Authorization", token).cookie('token', token).cookie('refreshToken', refreshToken).status(HttpStatus.OK)
                .send(responser.success(
                    loggedAdmin,
                    translate('admin.account.created'),
                    HttpStatus.OK));
        } catch (err) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Sementara Waktu Tidak Dapat Mendaftar"))
        }
    }

    async getCurrentSession(req, res) {
        const token = req.header('Authorization').split(" ")[1]

        const decode = jwt.verify(token, process.env.TOKEN_SECRET)
        return res.status(HttpStatus.OK).send(responser.success(decode, HttpStatus.OK));


    }

    async refreshToken(req, res) {

        const { error } = refreshTokenValidator(req.body)

        if (error) {
            return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
        }

        if (!req.header('Authorization')) return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Not Provided", HttpStatus.FORBIDDEN))

        const token = req.header('Authorization').split(" ")[1]

        if (!token) return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Not Provided", HttpStatus.FORBIDDEN))

        const decode = jwt.decode(token);

        if (!decode) {
            return res.status(HttpStatus.FORBIDDEN).send(responser.error("Invalid Token", HttpStatus.FORBIDDEN))
        }

        const cache = await redis.get(`admin.${decode.data.admin._id}`)

        if (!cache) {
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Invalid Refresh Token", HttpStatus.UNAUTHORIZED))
        }

        const payload = cache

        if (token !== payload.token) {
            return res.status(HttpStatus.FORBIDDEN).send(responser.error("Token Not Match", HttpStatus.FORBIDDEN))
        }

        if (req.body.refreshToken.toUpperCase() !== payload.refreshToken.toUpperCase()) {
            return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Refresh Token Not Match", HttpStatus.NOT_ACCEPTABLE))
        }

        try {

            const admin = await AdminModel.findOne({ _id: decode.data.admin._id })

            if (!admin) {
                return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Invalid Payload Refresh Token", HttpStatus.NOT_ACCEPTABLE))
            }

            admin.password = undefined

            const loggedAdmin = {
                admin
            }

            const token = jwt.sign(loggedAdmin, admin._id)

            const refreshToken = uuidv4().toUpperCase()

            jwt.setCache(`admin.${admin._id}`, token, refreshToken)

            const tokenList = {

                "accessToken": token,
                "refreshToken": refreshToken
            }

            loggedAdmin['token'] = tokenList

            return res.status(HttpStatus.OK).send(responser.success(loggedAdmin, "OK", HttpStatus.OK))

        } catch (err) {
            console.error(err)
            return res.status(HttpStatus.UNAUTHORIZED).send(responser.error("Session Expired", HttpStatus.UNAUTHORIZED))
        }

    }

    async login(req, res) {

        const { error } = loginValidator(req.body)

        if (error) {

            return res.status(HttpStatus.BAD_REQUEST).send(responser.error(error.details[0].message, HttpStatus.BAD_REQUEST));
        }

        let admin = await AdminModel.findOne({ email: req.body.email })

        if (!admin) return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Email Atau Kata Sandi Salah", HttpStatus.BAD_REQUEST));

        const validPass = await bcrypt.compare(req.body.password, admin.password)

        if (!validPass) return res.status(HttpStatus.BAD_REQUEST).send(responser.error("Email Atau Kata Sandi Salah", HttpStatus.BAD_REQUEST));

        if (!admin.active) {
            res.status(HttpStatus.BAD_REQUEST).send(responser.error("Akun Telah Di Non-Aktifkan", HttpStatus.BAD_REQUEST));
        }

        admin.password = undefined

        const loggedAdmin = {
            admin
        }

        const token = jwt.sign(loggedAdmin, `admin.${admin._id}`)

        const refreshToken = uuidv4().toUpperCase()

        jwt.setCache(`admin.${admin._id}`, token, refreshToken)

        const tokenList = {

            "accessToken": token,
            "refreshToken": refreshToken
        }

        loggedAdmin['token'] = tokenList

        return res.header("Authorization", token).status(HttpStatus.OK).send(responser.success(loggedAdmin, "OK"));

    }

    // async loginByPhone(req, res) {

    //     const { error } = byPhone(req.body)

    //     if (error) {
    //         return res.status(400).send(error.details[0].message)
    //     }

    //     const user = await User.findOne({ phone: req.body.phone, isPhoneVerified: true })

    //     if (!user) return res.status(HttpStatus.NOT_FOUND).send("Telepon Atau Password Salah")

    //     const validPass = await bcrypt.compare(req.body.password, user.password)

    //     if (!validPass) return res.status(HttpStatus.NOT_FOUND).send("Telepon Atau Password Salah")

    //     // var otp = parseInt(Math.random() * 10000);

    //     // let sendSms = SMSGateway.sendSms({
    //     //     from: "BELIAYAMCOM",
    //     //     to: "62895402275040",
    //     //     text: `Kode OTP Anda Adalah: ${otp} \r\nJANGAN MEMBERITAHU KODE RAHASIA INI KE SIAPAPUN TERMASUK PIHAK PT. BELI AYAM COM
    //     //     `
    //     // });

    //     // expired 10 menit
    //     // let expired = moment().add(600000, 'milliseconds')

    //     // const updateOtp = {
    //     //     otp: {
    //     //         code: otp,
    //     //         expiredDate: expired,
    //     //         expired: false
    //     //     }
    //     // }

    //     // await User.updateOne({
    //     //     _id: user._id
    //     // }, updateOtp)

    //     // buat message queue untuk expired

    //     // const loggedUser = {
    //     //     _id: user._id,
    //     //     name: user.name,
    //     //     email: user.email
    //     // }

    //     const token = jwt.sign({
    //         user: user
    //     }, process.env.TOKEN_SECRET)

    //     user['token'] = token

    //     return res.status(HttpStatus.OK).send(responser.success(user), "OK", HttpStatus.OK)
    // }

    // async verifyPhoneByUserId(req, res) {

    //     const { error } = verifyPhoneByUserOTP(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     let isValid = await this.isIdValid(req.body.user_id)

    //     if (!isValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
    //         );
    //     }

    //     const user = await User.findOne({ _id: req.body.user_id })

    //     if (!user) {
    //         return res.status(HttpStatus.NOT_FOUND).send(responser.error("Pengguna Tidak Ditemukan", HttpStatus.NOT_FOUND));
    //     }

    //     client.get(`smsOtp.${user.id}`, async (err, request) => {

    //         if (!request) {

    //             await User.updateOne({
    //                 _id: user.id
    //             }, {
    //                 $set: {
    //                     "otpSms.code": 0,
    //                     "otpSms.attempts": 0,
    //                     "otpSms.expired": true,
    //                     "otpSms.expiredDate": Date.now(),

    //                 }
    //             }, { upsert: true })

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Telah Kadaluarsa", HttpStatus.NOT_ACCEPTABLE));
    //         }

    //         if (user['otpSms']['attempts'] >= 5) {

    //             await User.updateOne({
    //                 _id: user.id
    //             }, {
    //                 $set: {
    //                     "otpSms.code": 0,
    //                     "otpSms.attempts": 0,
    //                     "otpSms.expired": true,
    //                     "otpSms.expiredDate": Date.now(),

    //                 }
    //             })

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Terlalu Banyak Percobaan, Harap Kirim Ulang SMS Verifikasi", HttpStatus.NOT_ACCEPTABLE));

    //         }

    //         if (parseInt(req.body.code) !== parseInt(user.otpSms.code) && user.otpSms.expired) {

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Verifikasi Gagal, Harap Kirim Ulang SMS Verifikasi", HttpStatus.NOT_ACCEPTABLE));

    //         } else if (parseInt(req.body.code) !== parseInt(user.otpSms.code)) {

    //             await User.updateOne({
    //                 _id: user.id
    //             }, {
    //                 $inc: {
    //                     "otpSms.attempts": 1

    //                 }
    //             })

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Verifikasi Salah", HttpStatus.NOT_ACCEPTABLE));

    //         }

    //         client.expireat(`otpSms.${user._id}`, 0);

    //         await User.updateOne({
    //             _id: user.id
    //         }, {
    //             $set: {
    //                 "otpSms.code": 0,
    //                 "otpSms.attempts": 0,
    //                 "otpSms.expired": true,
    //                 "otpSms.expiredDate": Date.now(),
    //                 "isPhoneVerified": true,

    //             }
    //         }, { upsert: true })

    //         const newUser = await User.findOne({ _id: user.id })

    //         return res.status(HttpStatus.OK).send(responser.success({ user: newUser }, HttpStatus.OK));

    //     })

    // }

    // async resendOtpVerifyPhone(req, res) {

    //     const { error } = resendPhoneVerify(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     let isValid = await this.isIdValid(req.body.user_id)

    //     if (!isValid) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(
    //             responser.error("User ID Tidak Valid", HttpStatus.BAD_REQUEST)
    //         );
    //     }

    //     const user = await User.findOne({ _id: req.body.user_id })

    //     if (!user) {
    //         return res.status(HttpStatus.NOT_FOUND).send(responser.error("User ID Tidak Terdaftar", HttpStatus.NOT_FOUND));
    //     }

    //     if (user.isPhoneVerified) {
    //         return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Tidak Bisa Mem-verifikasi Ulang Nomor Yang Telah Terverifikasi Sebelumnya", HttpStatus.NOT_ACCEPTABLE));
    //     }

    //     var otp = parseInt(Math.random() * 10000);

    //     // let sendSms = SMSGateway.sendSms({
    //     //     from: "BELIAYAMCOM",
    //     //     to: "62895402275040",
    //     //     text: `Kode OTP Anda Adalah: ${otp} \r\nJANGAN MEMBERITAHU KODE RAHASIA INI KE SIAPAPUN TERMASUK PIHAK PT. BELI AYAM COM
    //     //     `
    //     // });

    //     //5 minutes on milliseconds
    //     let expiredTime = 300000
    //     let expired = moment().add(expiredTime, 'milliseconds')

    //     await User.updateOne({
    //         _id: req.body.user_id
    //     }, {
    //         phone: req.body.phone,
    //         isPhoneVerified: false,
    //         otpSms: {
    //             code: otp,
    //             attempts: 0,
    //             expiredDate: expired,
    //             expired: false
    //         }
    //     }, {
    //         upsert: true
    //     })

    //     client.setex(`smsOtp.${req.body.user_id}`, expiredTime, JSON.stringify(otp));

    //     return res.status(HttpStatus.OK).send(
    //         responser.success(
    //             {
    //                 otpSms: {
    //                     expiredDate: expired,
    //                     expired: false
    //                 }
    //             }, "Kode OTP Telah Dikirm Ke Nomor Telepon Anda, Harap Cek Telepon Anda")
    //     );

    // }

    // async verifyEmailOtp(req, res) {

    //     const { error } = emailVerify(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     const userExist = await User.findOne({ email: req.body.email })

    //     if (!userExist) {
    //         return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Email Atau Kode Verifikasi Salah", HttpStatus.NOT_ACCEPTABLE));
    //     }

    //     client.get(`emailOtp.${userExist.id}`, async (err, request) => {

    //         const user = await User.findOne({ email: req.body.email })

    //         if (!request) {

    //             await User.updateOne({
    //                 _id: user.id
    //             }, {
    //                 $set: {
    //                     "otpEmail.code": 0,
    //                     "otpEmail.attempts": 0,
    //                     "otpEmail.expired": true,
    //                     "otpEmail.expiredDate": Date.now(),

    //                 }
    //             }, { upsert: true })

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Telah Kadaluarsa", HttpStatus.NOT_ACCEPTABLE));
    //         }

    //         if (user['otpEmail']['attempts'] >= 5) {

    //             await User.updateOne({
    //                 _id: user.id
    //             }, {
    //                 $set: {
    //                     "otpEmail.code": 0,
    //                     "otpEmail.attempts": 0,
    //                     "otpEmail.expired": true,
    //                     "otpEmail.expiredDate": Date.now(),

    //                 }
    //             })

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Terlalu Banyak Percobaan, Harap Kirim Ulang Email Verifikasi", HttpStatus.NOT_ACCEPTABLE));

    //         }

    //         if (parseInt(req.body.code) !== parseInt(user.otpEmail.code) && user.otpEmail.expired) {

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Verifikasi Gagal, Harap Kirim Ulang Email Verifikasi", HttpStatus.NOT_ACCEPTABLE));

    //         } else if (parseInt(req.body.code) !== parseInt(user.otpEmail.code)) {

    //             await User.updateOne({
    //                 _id: user.id
    //             }, {
    //                 $inc: {
    //                     "otpEmail.attempts": 1

    //                 }
    //             })

    //             return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kode Verifikasi Salah", HttpStatus.NOT_ACCEPTABLE));

    //         }

    //         client.expireat(`emailOtp.${user._id}`, 0);

    //         await User.updateOne({
    //             _id: user.id
    //         }, {
    //             $set: {
    //                 "otpEmail.code": 0,
    //                 "otpEmail.attempts": 0,
    //                 "otpEmail.expired": true,
    //                 "otpEmail.expiredDate": Date.now(),
    //                 "isEmailVerified": true,

    //             }
    //         })

    //         const newUser = await User.findOne({ _id: user.id })

    //         newUser.password = undefined
    //         newUser.otpEmail = undefined
    //         newUser.otpSms = undefined

    //         const token = jwt.sign({
    //             user: newUser
    //         }, process.env.TOKEN_SECRET)

    //         return res.status(HttpStatus.OK).setHeader('Authorization', `Bearer ${token}`).send(responser.success({ user: newUser, token: token }));

    //     })
    // }

    // async resendVerifyEmail(req, res) {

    //     const { error } = resendEmailVerify(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     const userExist = await User.findOne({ email: req.body.email })

    //     if (!userExist) {
    //         return res.status(HttpStatus.NOT_FOUND).send(responser.error("Email Tidak Terdaftar", HttpStatus.NOT_FOUND));
    //     }

    //     var otp = parseInt(Math.random() * 10000);

    //     let expiredTime = 1200000 //20 minutes on milliseconds
    //     let expired = moment().add(expiredTime, 'milliseconds')

    //     await User.updateOne({
    //         email: userExist.email
    //     }, {
    //         $set: {
    //             "otpEmail.code": otp,
    //             "otpEmail.attempts": 0,
    //             "otpEmail.expired": false,
    //             "otpEmail.expiredDate": expired,

    //         }
    //     }, { upsert: true })

    //     SendVerifyEmail.send({
    //         to: userExist.email,
    //         subject: "Verifikasi Email Anda | PT. BELI AYAM COM",
    //         text: `Kode Verifikasi Email Anda Adalah ${otp}`
    //     })

    //     client.setex(`emailOtp.${userExist._id}`, expiredTime, JSON.stringify(otp));

    //     res.status(HttpStatus.OK).send(responser.success({
    //         email: userExist.email,
    //         otpExpired: expired
    //     },
    //         `Email Verifikasi Telah Dikirim Ke Alamat Email ${userExist.email}`,
    //         HttpStatus.OK))

    // }

    // async sendEmailForgetPassword(req, res) {

    //     const { error } = sendEmailForgetPassword(req.body)

    //     if (error) {
    //         return res.status(HttpStatus.BAD_REQUEST).send(responser.validation(error.details[0].message, HttpStatus.BAD_REQUEST))
    //     }

    //     const userExist = await User.findOne({ email: req.body.email })

    //     if (!userExist) {
    //         return res.status(HttpStatus.NOT_FOUND).send(responser.error("Email Tidak Terdaftar", HttpStatus.NOT_FOUND));
    //     }

    //     SendForgetPassword.send({
    //         to: userExist.email,
    //         subject: "Reset Password | PT. BELI AYAM COM",
    //         text: `Reset Kata Sandi Anda Dengan Klik Tombol Dibawah`
    //     })

    //     res.status(HttpStatus.OK).send(responser.success({
    //         email: userExist.email
    //     },
    //         `Link Untuk Me-Reset Kata Sandi Anda Telah Dikirim Ke Alamat Email ${userExist.email}`,
    //         HttpStatus.OK))
    // }

    async changePassword(req, res) {

        const { error } = changePassword(req.body)

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

        const validPass = await bcrypt.compare(req.body.old_password, userExist.password)

        if (!validPass) return res.status(HttpStatus.NOT_ACCEPTABLE).send(responser.error("Kata Sandi Salah", HttpStatus.NOT_ACCEPTABLE))

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.new_password, salt)

        try {
            const user = await User.updateOne({
                _id: req.body.user_id
            }, {
                password: newPassword,
                passwordLastUpdate: Date.now()
            }, {
                upsert: true
            })

            res.status(HttpStatus.OK).send(responser.success([],
                "Kata Sandi Berhasil Di Perbarui",
                HttpStatus.OK))
        } catch (err) {

            res.status(HttpStatus.BAD_REQUEST).send(responser.success([],
                "Tidak Bisa Mengganti Kata Sandi",
                HttpStatus.BAD_REQUEST))
        }

    }

    isIdValid(id) {
        if (mongoose.isValidObjectId(id)) {
            return true
        }
        return false
    }

}

module.exports = new AdminController
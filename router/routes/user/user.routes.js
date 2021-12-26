const router = require('express').Router();

// middleware
const verifyToken = require('@middleware/auth/verifyToken')

// controller
const AddressController = require('@controller/Address/Address.controller')
const AuthController = require('@controller/Auth/Auth.controller')
const UserController = require('@controller/User/User.controller')

router.get('/', verifyToken, (req, res) => UserController.getUsers(req, res))

router.get('/me', verifyToken, (req, res) => UserController.getCurrentUser(req, res))

router.put('/active', verifyToken, (req, res) => UserController.updateActiveUser(req, res))

router.put('/profile/name/change', verifyToken, (req, res) => UserController.changeName(req, res))
router.put('/profile/email/change', verifyToken, (req, res) => UserController.changeEmail(req, res))
router.put('/profile/password/change', verifyToken, (req, res) => AuthController.changePassword(req, res))

router.post('/phone', verifyToken, (req, res) => UserController.addPhone(req, res))
router.post('/phone/verify', verifyToken, (req, res) => AuthController.verifyPhoneByUserId(req, res))
router.post('/phone/resend', verifyToken, (req, res) => AuthController.resendOtpVerifyPhone(req, res))

router.get('/address', verifyToken, (req, res) => { AddressController.getAddressesByUserId(req, res) })
router.get('/address/:addressId', verifyToken, (req, res) => { AddressController.getAddressByUserId(req, res) })
router.put('/address/:addressId', verifyToken, (req, res) => { AddressController.updateAdressByAddressId(req, res) })
router.post('/address', verifyToken, (req, res) => { AddressController.storeAdressByUserId(req, res) })
router.delete('/address/:addressId', verifyToken, (req, res) => { AddressController.deleteAddressByAddressId(req, res) })

module.exports = router;
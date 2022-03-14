const router = require('express').Router();

const AdminController = require('@controller/Admin/Admin/Admin.controller')

router.get('/', (req, res) => AdminController.getUsers(req, res))

router.get('/me', (req, res) => AdminController.getCurrentUser(req, res))

router.put('/active', (req, res) => AdminController.updateActiveUser(req, res))

router.put('/profile/name/change', (req, res) => AdminController.changeName(req, res))
router.put('/profile/email/change', (req, res) => AdminController.changeEmail(req, res))
router.put('/profile/password/change', (req, res) => AdminController.changePassword(req, res))

module.exports = router;
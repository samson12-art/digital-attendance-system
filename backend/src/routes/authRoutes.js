const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', require('../middleware/auth').requireAuth, authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/change-password', require('../middleware/auth').requireAuth, authController.changePassword);

module.exports = router;

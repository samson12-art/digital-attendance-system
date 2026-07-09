const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.put('/change-password', require('../middleware/auth').requireAuth, authController.changePassword);

module.exports = router;

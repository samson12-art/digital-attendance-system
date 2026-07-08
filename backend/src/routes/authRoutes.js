const express = require('express');
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Auth routes are working!' });
});

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', auth, authController.me);
router.get('/users', auth, authorize('admin'), authController.getUsers);
router.get('/dashboard-stats', auth, authorize('admin'), authController.getDashboardStats);

module.exports = router;

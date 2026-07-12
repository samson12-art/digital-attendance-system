const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/generate', requireAuth, requireRole('admin', 'teacher'), qrController.generateQR);
router.get('/current/:class_id', requireAuth, qrController.getCurrentCode);
router.post('/checkin', requireAuth, requireRole('student'), qrController.checkIn);
router.post('/verify', requireAuth, qrController.verifyCode);

module.exports = router;

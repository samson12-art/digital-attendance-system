const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/stats', requireAuth, requireRole('admin'), adminController.getStats);

module.exports = router;

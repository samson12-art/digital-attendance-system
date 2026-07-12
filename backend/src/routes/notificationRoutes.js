const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/send-alert', requireAuth, requireRole('admin', 'teacher'), notificationController.sendAttendanceAlert);
router.post('/low-attendance', requireAuth, requireRole('admin', 'teacher'), notificationController.sendLowAttendanceWarning);
router.post('/bulk-low-attendance', requireAuth, requireRole('admin', 'teacher'), notificationController.sendBulkLowAttendanceWarnings);
router.get('/low-attendance-students', requireAuth, requireRole('admin', 'teacher'), notificationController.getLowAttendanceStudents);
router.post('/test-email', requireAuth, requireRole('admin'), notificationController.testEmail);

module.exports = router;

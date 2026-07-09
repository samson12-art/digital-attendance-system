const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/mark', requireAuth, requireRole('admin', 'teacher'), attendanceController.markAttendance);
router.get('/student/:id', requireAuth, attendanceController.getStudentAttendance);

module.exports = router;

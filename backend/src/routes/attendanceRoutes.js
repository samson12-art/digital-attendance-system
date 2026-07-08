module.exports = { /* attendance routes */ } 
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Mark attendance (teacher only)
router.post('/mark', authorize('teacher', 'admin'), attendanceController.markAttendance);

// Mark bulk attendance (teacher only)
router.post('/mark-bulk', authorize('teacher', 'admin'), attendanceController.markBulkAttendance);

// Get attendance by student (student can view own, teacher/admin can view any)
router.get('/student/:studentId', attendanceController.getAttendanceByStudent);

// Get attendance by course (teacher only for their courses)
router.get('/course/:courseId', authorize('teacher', 'admin'), attendanceController.getAttendanceByCourse);

// Get today's attendance for a course
router.get('/today/:courseId', authorize('teacher', 'admin'), attendanceController.getTodayAttendance);

// Get attendance stats for a student
router.get('/stats/:studentId', attendanceController.getAttendanceStats);

// Update attendance record (teacher only)
router.put('/:id', authorize('teacher', 'admin'), attendanceController.updateAttendance);

// Get attendance summary for a student
router.get('/summary/:studentId', attendanceController.getAttendanceSummary);

// Get course attendance summary (teacher only)
router.get('/course-summary/:courseId', authorize('teacher', 'admin'), attendanceController.getCourseAttendanceSummary);

// Get daily report (admin only)
router.get('/daily-report', authorize('admin'), attendanceController.getDailyReport);

// Get course schedule
router.get('/schedule/:courseId', attendanceController.getCourseSchedule);

// Get sections
router.get('/sections', attendanceController.getSections);

module.exports = router;
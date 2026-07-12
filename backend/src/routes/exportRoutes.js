const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/attendance/excel', requireAuth, requireRole('admin', 'teacher'), exportController.exportAttendanceExcel);
router.get('/attendance/pdf', requireAuth, requireRole('admin', 'teacher'), exportController.exportAttendancePDF);
router.get('/students/excel', requireAuth, requireRole('admin', 'teacher'), exportController.exportStudentsExcel);
router.get('/students/pdf', requireAuth, requireRole('admin', 'teacher'), exportController.exportStudentsPDF);
router.get('/report/pdf', requireAuth, requireRole('admin'), exportController.exportReportPDF);

module.exports = router;

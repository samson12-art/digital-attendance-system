const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulkController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/import-students', requireAuth, requireRole('admin'), bulkController.uploadMiddleware, bulkController.importStudents);
router.post('/mark-attendance', requireAuth, requireRole('admin', 'teacher'), bulkController.bulkMarkAttendance);
router.post('/mark-all-present', requireAuth, requireRole('admin', 'teacher'), bulkController.markAllPresent);
router.post('/batch-classes', requireAuth, requireRole('admin'), bulkController.batchCreateClasses);
router.get('/csv-template', requireAuth, requireRole('admin'), bulkController.getCSVTemplate);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/students', requireAuth, requireRole('admin', 'teacher'), userController.getTeacherStudents);
router.get('/classes', requireAuth, requireRole('admin', 'teacher'), userController.getTeacherClasses);

module.exports = router;

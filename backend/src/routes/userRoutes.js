const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/students', requireAuth, requireRole('admin', 'teacher'), userController.getStudents);
router.get('/teachers', requireAuth, requireRole('admin'), userController.getTeachers);
router.delete('/:id', requireAuth, requireRole('admin'), userController.deleteUser);
router.get('/:id/courses', requireAuth, userController.getStudentCourses);

module.exports = router;

const express = require('express');
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/students', authorize('admin', 'teacher'), userController.getStudents);
router.get('/teachers', authorize('admin'), userController.getTeachers);
router.get('/sections', userController.getSections);
router.get('/:studentId/courses', userController.getStudentCourses);
router.get('/:studentId/available-courses', authorize('admin'), userController.getAvailableCourses);
router.get('/:id', userController.getUser);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.post('/enroll', authorize('admin'), userController.enrollStudent);

module.exports = router;

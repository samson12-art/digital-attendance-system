const express = require('express');
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', userController.getAllCourses);
router.post('/', authorize('admin'), userController.createCourse);
router.put('/:id', authorize('admin'), userController.updateCourse);
router.delete('/:id', authorize('admin'), userController.deleteCourse);
router.get('/:courseId/students', authorize('admin', 'teacher'), userController.getCourseStudents);
router.get('/:courseId/schedule', userController.getCourseSchedule);

module.exports = router;

module.exports = { /* user controller */ } 
const User = require('../models/User');
const Course = require('../models/Course');
const logger = require('../utils/logger');

// ============ USER MANAGEMENT ============

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ success: true, users });
    } catch (error) {
        logger.error(`Get all users error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        res.json({ success: true, user });
    } catch (error) {
        logger.error(`Get user error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, full_name, role, is_active } = req.body;

        const user = await User.update(id, { email, full_name, role, is_active });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        logger.info(`User ${id} updated`);
        res.json({ 
            success: true,
            message: 'User updated successfully',
            user 
        });
    } catch (error) {
        logger.error(`Update user error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await User.delete(id);
        if (!deleted) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        logger.info(`User ${id} deleted`);
        res.json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        logger.error(`Delete user error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await User.getStudents();
        res.json({ success: true, students });
    } catch (error) {
        logger.error(`Get students error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        const teachers = await User.getTeachers();
        res.json({ success: true, teachers });
    } catch (error) {
        logger.error(`Get teachers error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// ============ SECTION MANAGEMENT ============

exports.getSections = async (req, res) => {
    try {
        const sections = await Course.getSections();
        res.json({ success: true, sections });
    } catch (error) {
        logger.error(`Get sections error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getCourseSchedule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const schedule = await Course.getCourseSchedule(courseId);
        res.json({ success: true, schedule });
    } catch (error) {
        logger.error(`Get course schedule error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// ============ COURSE MANAGEMENT ============

exports.createCourse = async (req, res) => {
    try {
        const { course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours } = req.body;
        
        const course = await Course.create({ 
            course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours 
        });
        
        logger.info(`Course ${course_code} created`);
        res.status(201).json({ 
            success: true,
            message: 'Course created successfully',
            course 
        });
    } catch (error) {
        logger.error(`Create course error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.getAll();
        res.json({ success: true, courses });
    } catch (error) {
        logger.error(`Get courses error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_name, description, teacher_id, section_id, semester, academic_year, credit_hours } = req.body;

        const course = await Course.update(id, { course_name, description, teacher_id, section_id, semester, academic_year, credit_hours });
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        logger.info(`Course ${id} updated`);
        res.json({ 
            success: true,
            message: 'Course updated successfully',
            course 
        });
    } catch (error) {
        logger.error(`Update course error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Course.delete(id);
        if (!deleted) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        logger.info(`Course ${id} deleted`);
        res.json({ 
            success: true,
            message: 'Course deleted successfully' 
        });
    } catch (error) {
        logger.error(`Delete course error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

// ============ ENROLLMENT MANAGEMENT ============

exports.enrollStudent = async (req, res) => {
    try {
        const { studentId, courseId } = req.body;
        
        if (!studentId || !courseId) {
            return res.status(400).json({ 
                success: false,
                message: 'Student ID and Course ID are required' 
            });
        }

        const enrollmentId = await Course.enrollStudent(studentId, courseId);
        logger.info(`Student ${studentId} enrolled in course ${courseId}`);
        
        res.json({ 
            success: true,
            message: 'Student enrolled successfully',
            enrollmentId 
        });
    } catch (error) {
        logger.error(`Enroll student error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Server error' 
        });
    }
};

exports.getStudentCourses = async (req, res) => {
    try {
        const { studentId } = req.params;
        const courses = await Course.getStudentCourses(studentId);
        res.json({ success: true, courses });
    } catch (error) {
        logger.error(`Get student courses error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getCourseStudents = async (req, res) => {
    try {
        const { courseId } = req.params;
        const students = await Course.getEnrolledStudents(courseId);
        res.json({ success: true, students });
    } catch (error) {
        logger.error(`Get course students error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getAvailableCourses = async (req, res) => {
    try {
        const { studentId } = req.params;
        const courses = await Course.getAvailableCourses(studentId);
        res.json({ success: true, courses });
    } catch (error) {
        logger.error(`Get available courses error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};
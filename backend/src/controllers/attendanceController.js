module.exports = { /* attendance controller */ } 
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const logger = require('../utils/logger');

exports.markAttendance = async (req, res) => {
    try {
        const { student_id, course_id, status, remarks, latitude, longitude } = req.body;
        const check_in_time = new Date().toTimeString().split(' ')[0];

        // Verify student is enrolled in the course
        const enrolledStudents = await Course.getEnrolledStudents(course_id);
        const isEnrolled = enrolledStudents.some(s => s.id === parseInt(student_id));
        if (!isEnrolled) {
            return res.status(400).json({ 
                success: false,
                message: 'Student is not enrolled in this course' 
            });
        }

        const attendance = await Attendance.markAttendance({
            student_id,
            course_id,
            status,
            check_in_time,
            marked_by: req.user.id,
            remarks,
            latitude,
            longitude
        });

        logger.info(`Attendance marked for student ${student_id} in course ${course_id}`);
        res.json({ 
            success: true,
            message: 'Attendance marked successfully',
            attendance 
        });
    } catch (error) {
        logger.error(`Mark attendance error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getAttendanceByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, startDate, endDate } = req.query;

        // Check authorization
        if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(studentId)) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
        }

        const attendance = await Attendance.getAttendanceByStudent(studentId, courseId, startDate, endDate);
        res.json({ success: true, attendance });
    } catch (error) {
        logger.error(`Get student attendance error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getAttendanceByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { date } = req.query;

        // Verify teacher has access to this course
        if (req.user.role === 'teacher') {
            const courses = await Course.getByTeacher(req.user.id);
            const hasAccess = courses.some(c => c.id === parseInt(courseId));
            if (!hasAccess) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Access denied. You are not assigned to this course.' 
                });
            }
        }

        const attendance = await Attendance.getAttendanceByCourse(courseId, date);
        res.json({ success: true, attendance });
    } catch (error) {
        logger.error(`Get course attendance error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getAttendanceStats = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId } = req.query;

        const stats = await Attendance.getAttendanceStats(studentId, courseId);
        res.json({ success: true, stats });
    } catch (error) {
        logger.error(`Get attendance stats error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        // Get attendance record to check permissions
        const attendanceRecord = await Attendance.getById(id);
        if (!attendanceRecord) {
            return res.status(404).json({ 
                success: false,
                message: 'Attendance record not found' 
            });
        }

        // Check if teacher is assigned to this course
        if (req.user.role === 'teacher') {
            const courses = await Course.getByTeacher(req.user.id);
            const hasAccess = courses.some(c => c.id === attendanceRecord.course_id);
            if (!hasAccess) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Access denied. You are not assigned to this course.' 
                });
            }
        }

        const attendance = await Attendance.updateAttendance(id, { status, remarks });
        if (!attendance) {
            return res.status(404).json({ 
                success: false,
                message: 'Attendance record not found' 
            });
        }

        logger.info(`Attendance record ${id} updated`);
        res.json({ 
            success: true,
            message: 'Attendance updated successfully',
            attendance 
        });
    } catch (error) {
        logger.error(`Update attendance error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getAttendanceSummary = async (req, res) => {
    try {
        const { studentId } = req.params;
        const summary = await Attendance.getAttendanceSummary(studentId);
        res.json({ success: true, summary });
    } catch (error) {
        logger.error(`Get attendance summary error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getCourseAttendanceSummary = async (req, res) => {
    try {
        const { courseId } = req.params;
        const summary = await Attendance.getCourseAttendanceSummary(courseId);
        res.json({ success: true, summary });
    } catch (error) {
        logger.error(`Get course attendance summary error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        const report = await Attendance.getDailyReport(date);
        res.json({ success: true, report });
    } catch (error) {
        logger.error(`Get daily report error: ${error.message}`);
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
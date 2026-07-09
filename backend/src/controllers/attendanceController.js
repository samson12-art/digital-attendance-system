const AttendanceModel = require('../models/attendanceModel');
const UserModel = require('../models/userModel');
const pool = require('../config/database');

const attendanceController = {
    async markAttendance(req, res) {
        try {
            const { student_id, course_id, class_id, status, date, check_in_time, remarks } = req.body;
            const today = date || new Date().toISOString().split('T')[0];

            if (!student_id || !status) {
                return res.status(400).json({ success: false, message: 'Student and status are required' });
            }
            if (!['present', 'absent', 'late', 'excused'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid attendance status' });
            }

            const targetClassId = class_id || course_id;
            const student = await UserModel.getStudentById(student_id);
            if (!student) {
                return res.status(400).json({ success: false, message: 'Student not found' });
            }

            if (!targetClassId) {
                return res.status(400).json({ success: false, message: 'Class ID is required' });
            }

            const finalClassId = targetClassId;

            const targetClass = await pool.query('SELECT section, teacher_id FROM classes WHERE id = $1', [finalClassId]);
            if (!targetClass.rows[0]) {
                return res.status(400).json({ success: false, message: 'Class not found' });
            }

            if (req.user.role === 'teacher') {
                if (parseInt(targetClass.rows[0].teacher_id) !== parseInt(req.user.id)) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }
                const studentClass = await pool.query('SELECT section FROM classes WHERE id = $1', [student.class_id]);
                if (!studentClass.rows[0] || studentClass.rows[0].section !== targetClass.rows[0].section) {
                    return res.status(400).json({ success: false, message: 'Student is not assigned to this section' });
                }
            }

            const attendance = await AttendanceModel.markAttendance(
                student_id, finalClassId, today, status, check_in_time, req.user.id, remarks
            );

            res.json({ success: true, message: 'Attendance marked', attendance });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getStudentAttendance(req, res) {
        try {
            const { id } = req.params;
            if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(id)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            const attendance = await AttendanceModel.getByStudent(id);
            res.json({ success: true, attendance });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = attendanceController;

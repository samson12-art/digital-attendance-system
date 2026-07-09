const AttendanceModel = require('../models/attendanceModel');
const UserModel = require('../models/userModel');

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

            const finalClassId = targetClassId || student.class_id;
            if (!finalClassId || parseInt(finalClassId) !== parseInt(student.class_id)) {
                return res.status(400).json({ success: false, message: 'Student is not assigned to this class' });
            }

            if (req.user.role === 'teacher') {
                const cls = await UserModel.getClassTeacher(finalClassId);
                if (!cls || parseInt(cls.teacher_id) !== parseInt(req.user.id)) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
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

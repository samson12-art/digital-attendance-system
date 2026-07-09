const pool = require('../config/database');

const AttendanceModel = {
    markAttendance(student_id, class_id, date, status, check_in_time, marked_by, remarks) {
        return pool.query(`
            INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by, remarks)
            VALUES ($1, $2, $3, $4, COALESCE($5::time, CURRENT_TIME), $6, $7)
            ON CONFLICT (student_id, class_id, date)
            DO UPDATE SET
                status = EXCLUDED.status,
                check_in_time = EXCLUDED.check_in_time,
                marked_by = EXCLUDED.marked_by,
                remarks = EXCLUDED.remarks
            RETURNING *
        `, [student_id, class_id, date, status, check_in_time || null, marked_by, remarks || null])
            .then(r => r.rows[0]);
    },

    getByStudent(studentId) {
        return pool.query(`
            SELECT a.*, c.name as course_name, c.name as course_code,
                   c.name as class_name, c.section as class_section
            FROM attendance a
            JOIN classes c ON a.class_id = c.id
            WHERE a.student_id = $1
            ORDER BY a.date DESC
        `, [studentId]).then(r => r.rows);
    }
};

module.exports = AttendanceModel;

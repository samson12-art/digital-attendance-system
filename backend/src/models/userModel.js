const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const UserModel = {
    findByUsername(username) {
        return pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        ).then(r => r.rows[0]);
    },

    findByEmail(email) {
        return pool.query('SELECT id FROM users WHERE email = $1', [email])
            .then(r => r.rows[0]);
    },

    createUser(username, hashedPassword, email, full_name, role) {
        return pool.query(
            `INSERT INTO users (username, password, email, full_name, role, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id, username, email, full_name, role`,
            [username, hashedPassword, email, full_name, role]
        ).then(r => r.rows[0]);
    },

    getAllStudents() {
        return pool.query(`
            SELECT
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                u.class_id, u.entry_year, u.semester, u.department,
                c.name as class_name, c.section as class_section
            FROM users u
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE u.role = 'student' AND u.is_active = true
            ORDER BY u.full_name
        `).then(r => r.rows);
    },

    getAllTeachers() {
        return pool.query(`
            SELECT id, username, email, full_name, is_active, department
            FROM users
            WHERE role = 'teacher' AND is_active = true
            ORDER BY full_name
        `).then(r => r.rows);
    },

    deactivateUser(id) {
        return pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
    },

    getTeacherStudents(teacherId) {
        return pool.query(`
            SELECT DISTINCT
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                c.id as course_id, c.id as class_id, c.name as class_name,
                c.name as course_code, c.section as class_section,
                u.entry_year, u.semester, u.department,
                COALESCE(a.status, 'absent') as status, a.check_in_time
            FROM users u
            JOIN classes c ON u.class_id = c.id
            LEFT JOIN attendance a ON a.student_id = u.id
                AND a.class_id = c.id AND a.date = CURRENT_DATE
            WHERE c.teacher_id = $1 AND u.role = 'student' AND u.is_active = true
            ORDER BY u.full_name, c.name
        `, [teacherId]).then(r => r.rows);
    },

    getTeacherClasses(teacherId) {
        return pool.query(`
            SELECT c.*, COUNT(DISTINCT u.id) as student_count
            FROM classes c
            LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student' AND u.is_active = true
            WHERE c.teacher_id = $1
            GROUP BY c.id
            ORDER BY c.name, c.section
        `, [teacherId]).then(r => r.rows);
    },

    getStudentCourses(studentId) {
        return pool.query(`
            SELECT
                c.id, c.name as course_code, c.name as course_name, c.name as name,
                c.section, c.year, c.semester,
                u.full_name as teacher_name, '[]'::json as schedule,
                COUNT(a.id) as total_classes,
                COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) as attended_classes,
                COALESCE(ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL)
                    / NULLIF(COUNT(a.id), 0) * 100, 2), 0) as attendance_percentage
            FROM users student
            JOIN classes c ON student.class_id = c.id
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = student.id
            WHERE student.id = $1 AND student.role = 'student' AND student.is_active = true
            GROUP BY c.id, u.full_name
            ORDER BY c.name, c.section
        `, [studentId]).then(r => r.rows);
    },

    getStudentById(studentId) {
        return pool.query(
            `SELECT class_id FROM users WHERE id = $1 AND role = 'student' AND is_active = true`,
            [studentId]
        ).then(r => r.rows[0]);
    },

    getClassTeacher(classId) {
        return pool.query('SELECT teacher_id FROM classes WHERE id = $1', [classId])
            .then(r => r.rows[0]);
    },

    hashPassword(password) {
        return bcrypt.hash(password, 10);
    },

    comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
};

module.exports = UserModel;

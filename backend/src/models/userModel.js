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

    createUser(username, hashedPassword, email, full_name, role, class_id, extra = {}) {
        const { department, entry_year, level, semester, section } = extra;
        return pool.query(
            `INSERT INTO users (username, password, email, full_name, role, is_active, class_id, department, entry_year, level, semester, section)
             VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10, $11)
             RETURNING id, username, email, full_name, role, class_id, department, entry_year, level, semester, section`,
            [username, hashedPassword, email, full_name, role, class_id || null, department || null, entry_year || null, level || null, semester || null, section || null]
        ).then(r => r.rows[0]);
    },

    getAllStudents() {
        return pool.query(`
            SELECT
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                u.class_id, u.entry_year, u.semester, u.department, u.profile_photo,
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
        const sectionQuery = `
            SELECT DISTINCT
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                u.profile_photo,
                tc.id as course_id, tc.id as class_id,
                tc.name as class_name, tc.name as course_code,
                tc.section as class_section,
                u.entry_year, u.semester, u.department,
                COALESCE(a.status, 'absent') as status, a.check_in_time
            FROM users u
            LEFT JOIN classes sc ON u.class_id = sc.id
            LEFT JOIN classes tc ON tc.section = sc.section AND tc.teacher_id = $1
            LEFT JOIN attendance a ON a.student_id = u.id
                AND a.class_id = tc.id AND a.date = CURRENT_DATE
            WHERE u.role = 'student' AND u.is_active = true
                AND tc.id IS NOT NULL
            ORDER BY u.full_name
        `;

        const enrollmentQuery = `
            SELECT DISTINCT
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                u.profile_photo,
                cl.id as course_id, cl.id as class_id,
                cl.name as class_name, cl.name as course_code,
                cl.section as class_section,
                u.entry_year, u.semester, u.department,
                COALESCE(a.status, 'absent') as status, a.check_in_time
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses co ON e.course_id = co.id AND co.teacher_id = $1
            JOIN sections sec ON co.section_id = sec.id
            JOIN classes cl ON cl.name = co.course_name
                AND cl.section = sec.section_code
                AND cl.teacher_id = $1
            LEFT JOIN attendance a ON a.student_id = u.id
                AND a.class_id = cl.id AND a.date = CURRENT_DATE
            WHERE u.role = 'student' AND u.is_active = true
        `;

        const bothQuery = `(${enrollmentQuery}) UNION (${sectionQuery}) ORDER BY full_name`;

        return pool.query(bothQuery, [teacherId])
            .then(r => r.rows)
            .catch(err => {
                console.error('⚠️ Enrollment query failed, falling back to section-based:', err.message);
                return pool.query(sectionQuery, [teacherId]).then(r => r.rows);
            });
    },

    getTeacherClasses(teacherId) {
        return pool.query(`
            SELECT c.*,
                (SELECT COUNT(DISTINCT u.id) FROM users u
                 LEFT JOIN classes sc ON u.class_id = sc.id
                 WHERE sc.section = c.section
                   AND u.role = 'student' AND u.is_active = true) as student_count
            FROM classes c
            WHERE c.teacher_id = $1
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
            LEFT JOIN classes sc ON student.class_id = sc.id
            LEFT JOIN classes c ON c.section = sc.section
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = student.id
            WHERE student.id = $1 AND student.role = 'student' AND student.is_active = true
            GROUP BY c.id, u.full_name
            ORDER BY c.name, c.section
        `, [studentId]).then(r => r.rows);
    },

    updateProfilePhoto(userId, photoPath) {
        return pool.query(
            'UPDATE users SET profile_photo = $1 WHERE id = $2 RETURNING id, profile_photo',
            [photoPath, userId]
        ).then(r => r.rows[0]);
    },

    getExamEligibility(studentId) {
        return pool.query(`
            SELECT
                c.id as class_id,
                c.name as course_name,
                c.section,
                COUNT(a.id) as total_classes,
                COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
                COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
                COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
                CASE WHEN COUNT(a.id) > 0
                    THEN ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status = 'late') AS DECIMAL) / COUNT(a.id) * 100, 2)
                    ELSE 0 END as late_percent,
                CASE WHEN COUNT(a.id) > 0
                    THEN ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status = 'absent') AS DECIMAL) / COUNT(a.id) * 100, 2)
                    ELSE 0 END as absent_percent,
                CASE WHEN COUNT(a.id) > 0
                    THEN ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present','late')) AS DECIMAL) / COUNT(a.id) * 100, 2)
                    ELSE 0 END as attendance_percent,
                CASE
                    WHEN COUNT(a.id) = 0 THEN true
                    WHEN COUNT(a.id) FILTER (WHERE a.status = 'late')::DECIMAL / COUNT(a.id) * 100 >= 60 THEN false
                    WHEN COUNT(a.id) FILTER (WHERE a.status = 'absent')::DECIMAL / COUNT(a.id) * 100 > 23 THEN false
                    ELSE true
                END as eligible_for_exam
            FROM users student
            LEFT JOIN classes sc ON student.class_id = sc.id
            LEFT JOIN classes c ON c.section = sc.section
            LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = student.id
            WHERE student.id = $1 AND student.role = 'student' AND student.is_active = true
            GROUP BY c.id, c.name, c.section
            ORDER BY c.name, c.section
        `, [studentId]).then(r => r.rows);
    },

    getStudentById(studentId) {
        return pool.query(
            `SELECT id, username, email, full_name, role, class_id, profile_photo FROM users WHERE id = $1 AND role = 'student' AND is_active = true`,
            [studentId]
        ).then(r => r.rows[0]);
    },

    getUserProfile(userId) {
        return pool.query(
            `SELECT id, username, email, full_name, role, profile_photo FROM users WHERE id = $1 AND is_active = true`,
            [userId]
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

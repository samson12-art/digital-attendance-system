const pool = require('../config/database');

const ClassModel = {
    getAll() {
        return pool.query(`
            SELECT c.*, u.full_name as teacher_name,
                (SELECT COUNT(DISTINCT s.id) FROM users s
                 JOIN classes sc ON s.class_id = sc.id
                 WHERE sc.section = c.section AND s.role = 'student' AND s.is_active = true) as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.name, c.section
        `).then(r => r.rows);
    },

    create(name, section, year, semester, teacher_id) {
        return pool.query(
            `INSERT INTO classes (name, section, year, semester, teacher_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, section, year, semester, teacher_id || null]
        ).then(r => r.rows[0]);
    },

    delete(id) {
        return pool.query('UPDATE users SET class_id = NULL WHERE class_id = $1', [id])
            .then(() => pool.query('DELETE FROM classes WHERE id = $1', [id]));
    }
};

module.exports = ClassModel;

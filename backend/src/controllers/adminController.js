const pool = require('../config/database');

const adminController = {
    async getStats(req, res) {
        try {
            const result = await pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_active = true) as total_teachers,
                    (SELECT COUNT(*) FROM classes) as total_classes,
                    (SELECT COUNT(*) FROM classes) as total_courses
            `);
            res.json({ success: true, stats: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = adminController;

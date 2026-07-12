const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

const bulkController = {
    uploadMiddleware: upload.single('file'),

    async importStudents(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const records = [];
            const parser = fs.createReadStream(req.file.path).pipe(
                parse({ columns: true, skip_empty_lines: true, trim: true })
            );

            for await (const record of parser) {
                records.push(record);
            }

            fs.unlinkSync(req.file.path);

            let created = 0;
            let skipped = 0;
            let errors = [];
            const defaultPassword = await bcrypt.hash('123456', 10);

            for (const record of records) {
                try {
                    const username = record.username || record.Username || record.student_id || '';
                    const full_name = record.full_name || record['Full Name'] || record.name || record.Name || '';
                    const email = record.email || record.Email || '';
                    const class_name = record.class || record.Class || record.class_name || '';
                    const section = record.section || record.Section || '';
                    const department = record.department || record.Department || '';
                    const entry_year = record.entry_year || record['Entry Year'] || '';

                    if (!username || !full_name) {
                        skipped++;
                        errors.push(`Skipped row: missing username or name (${full_name || 'unknown'})`);
                        continue;
                    }

                    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
                    if (existing.rows[0]) {
                        skipped++;
                        continue;
                    }

                    let classId = null;
                    if (class_name || section) {
                        const classResult = await pool.query(
                            'SELECT id FROM classes WHERE name = $1 AND section = $2 LIMIT 1',
                            [class_name, section || 'A']
                        );
                        if (classResult.rows[0]) {
                            classId = classResult.rows[0].id;
                        }
                    }

                    const emailVal = email || `${username}@student.das.local`;

                    await pool.query(`
                        INSERT INTO users (username, password, email, full_name, role, is_active, class_id, department, entry_year)
                        VALUES ($1, $2, $3, $4, 'student', true, $5, $6, $7)
                    `, [username, defaultPassword, emailVal, full_name, classId, department || null, entry_year || null]);

                    created++;
                } catch (rowErr) {
                    skipped++;
                    errors.push(`Error for row: ${rowErr.message}`);
                }
            }

            res.json({
                success: true,
                message: `Import complete: ${created} created, ${skipped} skipped`,
                created,
                skipped,
                total: records.length,
                errors: errors.slice(0, 20)
            });
        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async bulkMarkAttendance(req, res) {
        try {
            const { class_id, student_ids, status = 'present', date } = req.body;

            if (!class_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
                return res.status(400).json({ success: false, message: 'Class ID and student IDs array are required' });
            }

            if (!['present', 'absent', 'late', 'excused'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const targetDate = date || new Date().toISOString().split('T')[0];

            if (req.user.role === 'teacher') {
                const classCheck = await pool.query('SELECT teacher_id FROM classes WHERE id = $1', [class_id]);
                if (!classCheck.rows[0] || parseInt(classCheck.rows[0].teacher_id) !== parseInt(req.user.id)) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }
            }

            let marked = 0;
            let failed = 0;

            for (const studentId of student_ids) {
                try {
                    await pool.query(`
                        INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by)
                        VALUES ($1, $2, $3, $4, CURRENT_TIME, $5)
                        ON CONFLICT (student_id, class_id, date)
                        DO UPDATE SET
                            status = EXCLUDED.status,
                            check_in_time = EXCLUDED.check_in_time,
                            marked_by = EXCLUDED.marked_by
                    `, [studentId, class_id, targetDate, status, req.user.id]);
                    marked++;
                } catch (err) {
                    failed++;
                }
            }

            res.json({
                success: true,
                message: `Bulk marking complete: ${marked} marked, ${failed} failed`,
                marked,
                failed,
                total: student_ids.length
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async markAllPresent(req, res) {
        try {
            const { class_id, date } = req.body;

            if (!class_id) {
                return res.status(400).json({ success: false, message: 'Class ID is required' });
            }

            const targetDate = date || new Date().toISOString().split('T')[0];

            if (req.user.role === 'teacher') {
                const classCheck = await pool.query('SELECT teacher_id FROM classes WHERE id = $1', [class_id]);
                if (!classCheck.rows[0] || parseInt(classCheck.rows[0].teacher_id) !== parseInt(req.user.id)) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }
            }

            const students = await pool.query(`
                SELECT u.id FROM users u
                JOIN classes c ON u.class_id = c.id
                WHERE c.id = $1 AND u.role = 'student' AND u.is_active = true
            `, [class_id]);

            let marked = 0;
            for (const student of students.rows) {
                try {
                    await pool.query(`
                        INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by)
                        VALUES ($1, $2, $3, 'present', CURRENT_TIME, $4)
                        ON CONFLICT (student_id, class_id, date)
                        DO UPDATE SET status = 'present', check_in_time = CURRENT_TIME, marked_by = $4
                    `, [student.id, class_id, targetDate, req.user.id]);
                    marked++;
                } catch (err) {
                    // skip
                }
            }

            res.json({
                success: true,
                message: `All ${marked} students marked present`,
                marked,
                total: students.rows.length
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async batchCreateClasses(req, res) {
        try {
            const { classes } = req.body;

            if (!classes || !Array.isArray(classes) || classes.length === 0) {
                return res.status(400).json({ success: false, message: 'Classes array is required' });
            }

            let created = 0;
            let skipped = 0;
            const results = [];

            for (const cls of classes) {
                try {
                    const { name, section, year, semester, teacher_id } = cls;

                    if (!name || !section || !year || !semester) {
                        skipped++;
                        results.push({ name: name || 'Unknown', status: 'skipped', reason: 'Missing required fields' });
                        continue;
                    }

                    const existing = await pool.query(
                        'SELECT id FROM classes WHERE name = $1 AND section = $2 AND year = $3 AND semester = $4',
                        [name, section, year, semester]
                    );

                    if (existing.rows[0]) {
                        skipped++;
                        results.push({ name, section, status: 'skipped', reason: 'Already exists' });
                        continue;
                    }

                    const result = await pool.query(
                        `INSERT INTO classes (name, section, year, semester, teacher_id)
                         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                        [name, section, year, semester, teacher_id || null]
                    );

                    created++;
                    results.push({ name, section, id: result.rows[0].id, status: 'created' });
                } catch (err) {
                    skipped++;
                    results.push({ name: cls.name || 'Unknown', status: 'error', reason: err.message });
                }
            }

            res.json({
                success: true,
                message: `Batch creation complete: ${created} created, ${skipped} skipped`,
                created,
                skipped,
                total: classes.length,
                results
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getCSVTemplate(req, res) {
        try {
            const csvContent = [
                'username,full_name,email,class,section,department,entry_year',
                'john_doe,John Doe,john@example.com,Operating Systems,A,Computer Science,2024',
                'jane_smith,Jane Smith,jane@example.com,Web Programming I,B,Computer Science,2024'
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.csv');
            res.send(csvContent);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = bulkController;

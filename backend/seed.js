// seed.js
// Run this once with: node seed.js
// It creates (or fixes) the demo users so login works, regardless of
// whatever bad data might currently be in the users table.

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'digital_attendance_db',
});

const demoUsers = [
    { username: 'admin',    password: '123', email: 'admin@example.com',    full_name: 'Admin User',   role: 'admin' },
    { username: 'teacher1', password: '123', email: 'teacher1@example.com', full_name: 'Teacher One',  role: 'teacher' },
    { username: 'student1', password: '123', email: 'student1@example.com', full_name: 'Student One',  role: 'student' },
];

async function seed() {
    try {
        for (const u of demoUsers) {
            const hashed = await bcrypt.hash(u.password, 10);

            const res = await pool.query(
                `INSERT INTO users (username, password, email, full_name, role, is_active)
                 VALUES ($1, $2, $3, $4, $5, true)
                 ON CONFLICT (username)
                 DO UPDATE SET password = EXCLUDED.password, is_active = true
                 RETURNING id`,
                [u.username, hashed, u.email, u.full_name, u.role]
            );

            u.id = res.rows[0]?.id;
            console.log(`✅ Seeded user: ${u.username} / ${u.password} (id=${u.id})`);
        }

        const teacher = demoUsers.find(u => u.role === 'teacher');
        const student = demoUsers.find(u => u.role === 'student');

        if (teacher?.id && student?.id) {
            const classRes = await pool.query(
                `INSERT INTO classes (name, section, year, semester, teacher_id)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                ['Demo Course', 'A', '2024', 'Fall', teacher.id]
            );

            let classId = classRes.rows[0]?.id;
            if (!classId) {
                const existing = await pool.query(
                    `SELECT id FROM classes WHERE teacher_id = $1 LIMIT 1`, [teacher.id]
                );
                classId = existing.rows[0]?.id;
            }

            if (classId) {
                await pool.query(
                    `UPDATE users SET class_id = $1 WHERE id = $2 AND role = 'student'`,
                    [classId, student.id]
                );
                console.log(`✅ Assigned student1 to class ${classId}`);
            }
        }

        console.log('\nAll demo users are ready. You can log in with:');
        demoUsers.forEach(u => console.log(`  ${u.username} / ${u.password}`));
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        console.error(
            '\nIf you see a constraint error, run this first:\n' +
            '  ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);'
        );
    } finally {
        await pool.end();
    }
}

seed();
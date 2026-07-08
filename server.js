const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 5001;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '12345',
    database: 'digital_attendance_db',
});

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, res, next) => {
    console.log('📥 ' + req.method + ' ' + req.url);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'OK' });
});

// ============================================
// LOGIN ROUTE
// ============================================
app.post('/api/auth/login', async (req, res) => {
    console.log('========================================');
    console.log('🔐 LOGIN HIT!');
    console.log('Username:', req.body.username);
    console.log('Password:', req.body.password);
    console.log('========================================');

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log('👤 User found:', user.username);
        console.log('🔑 Hash:', user.password);

        const match = await bcrypt.compare(password, user.password);
        console.log('🔑 Match:', match);

        if (!match) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('✅ SUCCESS!');
        console.log('========================================\n');

        const token = Buffer.from(JSON.stringify({ 
            id: user.id, 
            username: user.username, 
            role: user.role 
        })).toString('base64');

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// REGISTER ROUTE
// ============================================
app.post('/api/auth/register', async (req, res) => {
    console.log('========================================');
    console.log('📝 REGISTER REQUEST');
    console.log('Body:', req.body);
    console.log('========================================');

    try {
        const { username, password, email, full_name, role, class_id, entry_year, semester, department } = req.body;

        if (!username || !password || !email || !full_name || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, password, email, full_name, role, is_active, class_id, entry_year, semester, department) 
             VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9) 
             RETURNING id, username, email, full_name, role, class_id, entry_year, semester, department`,
            [username, hashedPassword, email, full_name, role, class_id || null, entry_year || null, semester || null, department || null]
        );

        console.log('✅ User registered:', username);
        console.log('========================================\n');

        res.json({
            success: true,
            message: 'Registration successful',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Register error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - GET STUDENTS
// ============================================
app.get('/api/users/students', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                u.class_id, u.entry_year, u.semester,
                c.name as class_name, c.section as class_section
            FROM users u
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE u.role = 'student' AND u.is_active = true
            ORDER BY u.full_name
        `);
        res.json({ success: true, students: result.rows });
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - GET TEACHERS
// ============================================
app.get('/api/users/teachers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, username, email, full_name, is_active, department
            FROM users 
            WHERE role = 'teacher' AND is_active = true
            ORDER BY full_name
        `);
        res.json({ success: true, teachers: result.rows });
    } catch (error) {
        console.error('❌ Error fetching teachers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - GET ALL USERS
// ============================================
app.get('/api/users/all', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, username, email, full_name, role, is_active
            FROM users 
            ORDER BY id
        `);
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - DELETE USER
// ============================================
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
        res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - GET CLASSES
// ============================================
app.get('/api/classes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.full_name as teacher_name
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.name
        `);
        res.json({ success: true, classes: result.rows });
    } catch (error) {
        console.error('❌ Error fetching classes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - CREATE CLASS
// ============================================
app.post('/api/classes', async (req, res) => {
    try {
        const { name, section, year, semester, teacher_id } = req.body;
        const result = await pool.query(
            `INSERT INTO classes (name, section, year, semester, teacher_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, section, year, semester, teacher_id || null]
        );
        res.json({ success: true, class: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating class:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - DELETE CLASS
// ============================================
app.delete('/api/classes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE users SET class_id = NULL WHERE class_id = $1', [id]);
        await pool.query('DELETE FROM classes WHERE id = $1', [id]);
        res.json({ success: true, message: 'Class deleted' });
    } catch (error) {
        console.error('❌ Error deleting class:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ADMIN - STATS
// ============================================
app.get('/api/admin/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_active = true) as total_teachers,
                (SELECT COUNT(*) FROM classes) as total_classes
        `);
        res.json({ success: true, stats: result.rows[0] });
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// STUDENT - GET MY COURSES
// ============================================
app.get('/api/users/:id/courses', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                c.id, c.name as course_code, c.name as course_name, c.section,
                u.full_name as teacher_name,
                COUNT(a.id) as total_classes,
                COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
                COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
                COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
                ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as attendance_percentage
            FROM classes c
            JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = $1
            WHERE e.student_id = $1 AND e.status = 'active'
            GROUP BY c.id, u.full_name
            ORDER BY c.name
        `, [id]);
        res.json({ success: true, courses: result.rows });
    } catch (error) {
        console.error('❌ Error fetching student courses:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// STUDENT - GET MY ATTENDANCE
// ============================================
app.get('/api/attendance/student/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                a.*,
                c.name as course_name,
                c.section as course_section
            FROM attendance a
            JOIN classes c ON a.class_id = c.id
            WHERE a.student_id = $1
            ORDER BY a.date DESC
        `, [id]);
        res.json({ success: true, attendance: result.rows });
    } catch (error) {
        console.error('❌ Error fetching student attendance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// TEACHER - GET STUDENTS
// ============================================
app.get('/api/teacher/students', async (req, res) => {
    try {
        const teacherId = req.query.teacher_id;
        if (!teacherId) {
            return res.status(400).json({ success: false, message: 'Teacher ID required' });
        }

        const result = await pool.query(`
            SELECT DISTINCT 
                u.id, u.username, u.email, u.full_name,
                c.id as class_id, c.name as class_name, c.section as class_section
            FROM users u
            JOIN classes c ON u.class_id = c.id
            WHERE c.teacher_id = $1 AND u.role = 'student' AND u.is_active = true
            ORDER BY u.full_name
        `, [teacherId]);

        res.json({ success: true, students: result.rows });
    } catch (error) {
        console.error('❌ Error fetching teacher students:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// TEACHER - GET CLASSES
// ============================================
app.get('/api/teacher/classes', async (req, res) => {
    try {
        const teacherId = req.query.teacher_id;
        if (!teacherId) {
            return res.status(400).json({ success: false, message: 'Teacher ID required' });
        }

        const result = await pool.query(`
            SELECT 
                c.*, 
                COUNT(DISTINCT u.id) as student_count
            FROM classes c
            LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student' AND u.is_active = true
            WHERE c.teacher_id = $1
            GROUP BY c.id
            ORDER BY c.name
        `, [teacherId]);

        res.json({ success: true, classes: result.rows });
    } catch (error) {
        console.error('❌ Error fetching teacher classes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// TEACHER - GET ATTENDANCE (FIXED - THIS WAS MISSING!)
// ============================================
app.get('/api/attendance/teacher/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                a.*,
                u.full_name as student_name,
                c.name as course_name,
                c.section as course_section
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            JOIN classes c ON a.class_id = c.id
            WHERE c.teacher_id = $1
            ORDER BY a.date DESC
            LIMIT 100
        `, [id]);

        res.json({ success: true, attendance: result.rows });
    } catch (error) {
        console.error('❌ Error fetching teacher attendance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// MARK ATTENDANCE
// ============================================
app.post('/api/attendance/mark', async (req, res) => {
    try {
        const { student_id, status, date, check_in_time } = req.body;
        const today = date || new Date().toISOString().split('T')[0];

        const studentResult = await pool.query(
            'SELECT class_id FROM users WHERE id = $1 AND role = $2',
            [student_id, 'student']
        );

        if (studentResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Student not found' });
        }

        const classId = studentResult.rows[0].class_id;
        if (!classId) {
            return res.status(400).json({ success: false, message: 'Student not assigned to any class' });
        }

        const result = await pool.query(`
            INSERT INTO attendance (student_id, class_id, date, status, check_in_time)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (student_id, class_id, date) 
            DO UPDATE SET status = $4, check_in_time = COALESCE($5, check_in_time)
            RETURNING *
        `, [student_id, classId, today, status, check_in_time || null]);

        res.json({ success: true, message: 'Attendance marked', attendance: result.rows[0] });
    } catch (error) {
        console.error('❌ Error marking attendance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.method, req.url);
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  📚 DIGITAL ATTENDANCE SYSTEM');
    console.log('========================================');
    console.log('  ✅ Server running on port 5001');
    console.log('  🌐 Login: http://localhost:5001/login.html');
    console.log('  📝 Register: http://localhost:5001/register.html');
    console.log('  🔧 Admin: http://localhost:5001/adminhome.html');
    console.log('  👨‍🏫 Teacher: http://localhost:5001/teacherhome.html');
    console.log('  👨‍🎓 Student: http://localhost:5001/studenthome.html');
    console.log('========================================\n');
});
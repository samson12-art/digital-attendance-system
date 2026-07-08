const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '12345',
    database: 'digital_attendance_db',
});

const logDir = path.join(__dirname, '../logs');
fs.mkdirSync(logDir, { recursive: true });

function writeLog(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFile(path.join(logDir, 'requests.log'), line, () => {});
    console.log(message);
}

app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, res, next) => {
    writeLog(`${req.method} ${req.url}`);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'OK' });
});

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/api/auth/login', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Open /login.html in the browser. Login API requires POST.'
    });
});

function getUserFromToken(req) {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '');
    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'development_secret_change_me');
    } catch (error) {
        return null;
    }
}

function requireAuth(req, res, next) {
    const user = getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    req.user = user;
    next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        next();
    };
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// LOGIN ROUTE
// ============================================
app.post('/api/auth/login', async (req, res) => {
    console.log('========================================');
    console.log('🔐 LOGIN HIT!');
    console.log('Username:', req.body.username);
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
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('✅ SUCCESS!');
        console.log('========================================\n');

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'development_secret_change_me',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

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
    console.log('Username:', req.body.username);
    console.log('========================================');

    try {
        const { username, password, email, full_name, role } = req.body;

        if (!username || !password || !email || !full_name || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        if (role === 'admin') {
            const requester = getUserFromToken(req);
            if (!requester || requester.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can create admin accounts' });
            }
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }
        if (password.length < 3) {
            return res.status(400).json({ success: false, message: 'Password must be at least 3 characters' });
        }

        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, password, email, full_name, role, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id, username, email, full_name, role`,
            [username, hashedPassword, email, full_name, role]
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
app.get('/api/users/students', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.username, u.email, u.full_name, u.role, u.is_active,
                u.class_id, u.entry_year, u.semester, u.department,
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
app.get('/api/users/teachers', requireAuth, requireRole('admin'), async (req, res) => {
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
// ADMIN - DELETE USER
// ============================================
app.delete('/api/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
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
app.get('/api/classes', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.full_name as teacher_name,
                   COUNT(DISTINCT s.id) as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN users s ON s.class_id = c.id AND s.role = 'student' AND s.is_active = true
            GROUP BY c.id, u.full_name
            ORDER BY c.name, c.section
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
app.post('/api/classes', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, section, year, semester, teacher_id } = req.body;
        if (!name || !section || !year || !semester) {
            return res.status(400).json({ success: false, message: 'Name, section, year, and semester are required' });
        }
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
app.delete('/api/classes/:id', requireAuth, requireRole('admin'), async (req, res) => {
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
app.get('/api/admin/stats', requireAuth, requireRole('admin'), async (req, res) => {
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
// TEACHER - GET STUDENTS (THIS IS THE FIX)
// ============================================
app.get('/api/teacher/students', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const teacherId = req.query.teacher_id;
        if (!teacherId) {
            return res.status(400).json({ success: false, message: 'Teacher ID required' });
        }
        if (req.user.role === 'teacher' && parseInt(req.user.id) !== parseInt(teacherId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT DISTINCT 
                u.id, 
                u.username, 
                u.email, 
                u.full_name,
                u.role,
                u.is_active,
                c.id as course_id,
                c.id as class_id,
                c.name as class_name,
                c.name as course_code,
                c.section as class_section,
                u.entry_year,
                u.semester,
                u.department,
                COALESCE(a.status, 'absent') as status,
                a.check_in_time
            FROM users u
            JOIN classes c ON u.class_id = c.id
            LEFT JOIN attendance a ON a.student_id = u.id
                AND a.class_id = c.id
                AND a.date = CURRENT_DATE
            WHERE c.teacher_id = $1 
            AND u.role = 'student' 
            AND u.is_active = true
            ORDER BY u.full_name, c.name
        `, [teacherId]);

        res.json({ success: true, students: result.rows });
    } catch (error) {
        console.error('❌ Error fetching teacher students:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// TEACHER - GET CLASSES (THIS IS THE FIX)
// ============================================
app.get('/api/teacher/classes', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const teacherId = req.query.teacher_id;
        if (!teacherId) {
            return res.status(400).json({ success: false, message: 'Teacher ID required' });
        }
        if (req.user.role === 'teacher' && parseInt(req.user.id) !== parseInt(teacherId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT 
                c.*, 
                COUNT(DISTINCT u.id) as student_count
            FROM classes c
            LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student' AND u.is_active = true
            WHERE c.teacher_id = $1
            GROUP BY c.id
            ORDER BY c.name, c.section
        `, [teacherId]);

        res.json({ success: true, classes: result.rows });
    } catch (error) {
        console.error('❌ Error fetching teacher classes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// MARK ATTENDANCE
// ============================================
app.post('/api/attendance/mark', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
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
        const studentResult = await pool.query(
            `SELECT class_id
             FROM users
             WHERE id = $1
             AND role = 'student'
             AND is_active = true`,
            [student_id]
        );

        if (studentResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Student not found' });
        }

        const finalClassId = targetClassId || studentResult.rows[0].class_id;
        if (!finalClassId || parseInt(finalClassId) !== parseInt(studentResult.rows[0].class_id)) {
            return res.status(400).json({ success: false, message: 'Student is not assigned to this class' });
        }

        if (req.user.role === 'teacher') {
            const classResult = await pool.query('SELECT teacher_id FROM classes WHERE id = $1', [finalClassId]);
            if (classResult.rows.length === 0 || parseInt(classResult.rows[0].teacher_id) !== parseInt(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        const result = await pool.query(`
            INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by, remarks)
            VALUES ($1, $2, $3, $4, COALESCE($5::time, CURRENT_TIME), $6, $7)
            ON CONFLICT (student_id, class_id, date)
            DO UPDATE SET
                status = EXCLUDED.status,
                check_in_time = EXCLUDED.check_in_time,
                marked_by = EXCLUDED.marked_by,
                remarks = EXCLUDED.remarks
            RETURNING *
        `, [student_id, finalClassId, today, status, check_in_time || null, req.user.id, remarks || null]);

        res.json({ success: true, message: 'Attendance marked', attendance: result.rows[0] });
    } catch (error) {
        console.error('❌ Error marking attendance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GET STUDENT ATTENDANCE
// ============================================
app.get('/api/attendance/student/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const result = await pool.query(`
            SELECT 
                a.*,
                c.name as course_name,
                c.name as course_code,
                c.name as class_name,
                c.section as class_section
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

app.get('/api/users/:id/courses', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const result = await pool.query(`
            SELECT
                c.id,
                c.name as course_code,
                c.name as course_name,
                c.name as name,
                c.section,
                c.year,
                c.semester,
                u.full_name as teacher_name,
                '[]'::json as schedule,
                COUNT(a.id) as total_classes,
                COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) as attended_classes,
                COALESCE(
                    ROUND(
                        CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL)
                        / NULLIF(COUNT(a.id), 0) * 100,
                        2
                    ),
                    0
                ) as attendance_percentage
            FROM users student
            JOIN classes c ON student.class_id = c.id
            LEFT JOIN users u ON c.teacher_id = u.id
            LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = student.id
            WHERE student.id = $1 AND student.role = 'student' AND student.is_active = true
            GROUP BY c.id, u.full_name
            ORDER BY c.name, c.section
        `, [id]);

        res.json({ success: true, courses: result.rows });
    } catch (error) {
        console.error('Error fetching student courses:', error);
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
const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  📚 DIGITAL ATTENDANCE SYSTEM');
    console.log('========================================');
    console.log(`  ✅ Server running on port ${PORT}`);
    console.log(`  🌐 Login: http://localhost:${PORT}/login.html`);
    console.log(`  📝 Register: http://localhost:${PORT}/register.html`);
    console.log(`  🔧 Admin: http://localhost:${PORT}/adminhome.html`);
    console.log(`  👨‍🏫 Teacher: http://localhost:${PORT}/teacherhome.html`);
    console.log('========================================\n');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing server or run another port:`);
        console.error('  PORT=5002 node server.js');
        process.exit(1);
    }

    throw error;
});

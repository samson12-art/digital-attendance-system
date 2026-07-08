const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'digital_attendance_db',
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'OK' });
});

// ============================================
// LOGIN ROUTE - THIS WILL WORK
// ============================================
app.post('/api/auth/login', async (req, res) => {
    console.log('========================================');
    console.log('🔐 LOGIN ROUTE EXECUTING!');
    console.log('📝 Username:', req.body.username);
    console.log('📝 Password:', req.body.password);
    console.log('========================================');

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Missing fields');
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        console.log('🔍 Looking for user:', username);
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            console.log('❌ User NOT found:', username);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log('👤 User found:', user.username);
        console.log('🔑 Hash in DB:', user.password);

        console.log('🔐 Comparing passwords...');
        const isValid = await bcrypt.compare(password, user.password);
        console.log('🔑 Password match:', isValid);

        if (!isValid) {
            console.log('❌ Password does NOT match!');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('========================================\n');

        res.json({
            success: true,
            message: 'Login successful',
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

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  📚 DIGITAL ATTENDANCE SYSTEM');
    console.log('========================================');
    console.log(`  ✅ Server running on port ${PORT}`);
    console.log(`  📡 API: http://localhost:${PORT}/api`);
    console.log(`  💚 Health: http://localhost:${PORT}/api/health`);
    console.log('========================================');
    console.log('\n  🔑 Demo Credentials:');
    console.log('    Admin:    admin / 123');
    console.log('    Teacher:  teacher1 / 123');
    console.log('    Student:  student1 / 123');
    console.log('========================================\n');
});
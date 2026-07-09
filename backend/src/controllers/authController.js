const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const pool = require('../config/database');
const { isValidEmail } = require('../middleware/auth');

const authController = {
    async login(req, res) {
        try {
            console.log(`[LOGIN] Request from ${req.ip}, method=${req.method}, url=${req.url}, content-type=${req.get('Content-Type')}, body=${JSON.stringify(req.body)}`);
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Username and password required' });
            }

            const user = await UserModel.findByUsername(username);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const match = await UserModel.comparePassword(password, user.password);
            if (!match) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'development_secret_change_me',
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    full_name: user.full_name,
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async register(req, res) {
        try {
            const { username, password, email, full_name, role, class_id } = req.body;
            if (!username || !password || !email || !full_name || !role) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
            if (!['admin', 'teacher', 'student'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role' });
            }
            if (role === 'admin') {
                const { getUserFromToken } = require('../middleware/auth');
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

            const existing = await UserModel.findByUsername(username);
            if (existing) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }

            const existingEmail = await UserModel.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }

            const hashedPassword = await UserModel.hashPassword(password);
            const user = await UserModel.createUser(username, hashedPassword, email, full_name, role, class_id);

            res.json({ success: true, message: 'Registration successful', user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current password and new password are required' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            }

            const user = await UserModel.findByUsername(req.user.username);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isValid = await UserModel.comparePassword(currentPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            const hashedPassword = await UserModel.hashPassword(newPassword);
            await pool.query(
                'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [hashedPassword, userId]
            );

            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = authController;

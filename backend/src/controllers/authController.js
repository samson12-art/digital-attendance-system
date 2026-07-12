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
                    email: user.email,
                    profile_photo: user.profile_photo || null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async register(req, res) {
        try {
            const requester = req.user;
            if (!requester || requester.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admins can register new users' });
            }

            const { username, password, email, full_name, role, class_id, department, entry_year, level, semester, section } = req.body;
            if (!username || !password || !email || !full_name || !role) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }
            if (!['admin', 'teacher', 'student'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role' });
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
            const user = await UserModel.createUser(username, hashedPassword, email, full_name, role, class_id, { department, entry_year, level, semester, section });

            res.json({ success: true, message: 'Registration successful', user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async forgotPassword(req, res) {
        try {
            const { username, email } = req.body;
            if (!username || !email) {
                return res.status(400).json({ success: false, message: 'Username and email are required' });
            }

            const user = await UserModel.findByUsername(username);
            if (!user || user.email !== email) {
                return res.status(401).json({ success: false, message: 'Username and email do not match our records' });
            }

            const resetToken = jwt.sign(
                { id: user.id, username: user.username, purpose: 'password-reset' },
                process.env.JWT_SECRET || 'development_secret_change_me',
                { expiresIn: '15m' }
            );

            res.json({ success: true, message: 'Identity verified. You can now reset your password.', token: resetToken });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ success: false, message: 'Token and new password are required' });
            }

            if (newPassword.length < 3) {
                return res.status(400).json({ success: false, message: 'Password must be at least 3 characters' });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_change_me');
            } catch (err) {
                return res.status(401).json({ success: false, message: 'Invalid or expired reset token' });
            }

            if (decoded.purpose !== 'password-reset') {
                return res.status(401).json({ success: false, message: 'Invalid reset token' });
            }

            const hashedPassword = await UserModel.hashPassword(newPassword);
            await pool.query(
                'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND is_active = true',
                [hashedPassword, decoded.id]
            );

            res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
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

const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { isValidEmail } = require('../middleware/auth');

const authController = {
    async login(req, res) {
        try {
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
            const { username, password, email, full_name, role } = req.body;
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
            const user = await UserModel.createUser(username, hashedPassword, email, full_name, role);

            res.json({ success: true, message: 'Registration successful', user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = authController;

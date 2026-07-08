const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

console.log('✅ Auth controller loaded');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

exports.login = async (req, res) => {
    console.log('========================================');
    console.log('🔐 LOGIN ATTEMPT');
    console.log('========================================');
    console.log('📝 Request body:', req.body);
    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Missing username or password');
            return res.status(400).json({ 
                success: false,
                message: 'Username and password are required' 
            });
        }

        console.log('🔍 Looking for user:', username);
        const user = await User.findByUsername(username);
        console.log('👤 User found:', user ? 'YES' : 'NO');
        
        if (user) {
            console.log('📧 User role:', user.role);
            console.log('🔑 Stored hash:', user.password);
        }
        
        if (!user) {
            logger.warn(`Login failed: User ${username} not found`);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        console.log('🔐 Comparing passwords...');
        const isValid = await User.comparePassword(password, user.password);
        console.log('🔑 Password valid:', isValid);

        if (!isValid) {
            console.log('❌ Password does NOT match!');
            logger.warn(`Login failed: Invalid password for user ${username}`);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        console.log('✅ Password matches!');
        await User.updateLastLogin(user.id);

        const token = generateToken(user);
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        };

        console.log('✅ Login successful for:', username);
        console.log('========================================\n');
        logger.info(`User ${username} logged in successfully`);

        res.json({ 
            success: true,
            token, 
            user: userData 
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        console.error('❌ Stack:', error.stack);
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, email, full_name, role } = req.body;

        if (!username || !password || !email || !full_name || !role) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid role' 
            });
        }

        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Username already exists' 
            });
        }

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }

        const user = await User.create({ username, password, email, full_name, role });
        logger.info(`New user registered: ${username} (${role})`);

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully', 
            user
        });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        res.json({ success: true, user });
    } catch (error) {
        logger.error(`Get user error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ success: true, users });
    } catch (error) {
        logger.error(`Get users error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await User.getDashboardStats();
        res.json({ success: true, stats });
    } catch (error) {
        logger.error(`Get dashboard stats error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
};
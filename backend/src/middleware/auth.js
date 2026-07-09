const jwt = require('jsonwebtoken');

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

module.exports = { getUserFromToken, requireAuth, requireRole, isValidEmail };

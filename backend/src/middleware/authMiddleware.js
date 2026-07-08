const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            logger.warn('No token provided');
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error(`Auth error: ${error.message}`);
        res.status(401).json({ 
            success: false,
            message: 'Token is not valid' 
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt: ${req.user.role} trying to access ${req.originalUrl}`);
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Insufficient permissions.' 
            });
        }
        next();
    };
};

module.exports = { auth, authorize };
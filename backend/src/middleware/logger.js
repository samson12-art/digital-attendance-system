const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    logger.debug(`${req.method} ${req.originalUrl} - Request received`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - IP: ${req.ip}`;
        
        if (res.statusCode >= 400) {
            logger.error(message);
        } else {
            logger.info(message);
        }
    });
    
    next();
};

module.exports = requestLogger;
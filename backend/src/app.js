const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

console.log('========================================');
console.log('📚 LOADING APPLICATION...');
console.log('========================================');

console.log('📂 Loading authRoutes...');
const authRoutes = require('./routes/authRoutes');
console.log('✅ authRoutes loaded');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '..')));

// Security
app.use(helmet());

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Routes
console.log('📡 Registering routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Routes registered');

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Digital Attendance System'
    });
});

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error: ' + err.message
    });
});

console.log('========================================');
console.log('✅ Application loaded');
console.log('========================================');

module.exports = app;
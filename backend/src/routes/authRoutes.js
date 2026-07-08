const express = require('express');
const router = express.Router();

console.log('🚀 AUTH ROUTES FILE IS EXECUTING!');

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Auth routes are working!' });
});

router.post('/login', (req, res) => {
    console.log('🔐 LOGIN ROUTE HIT!');
    console.log('📝 Request body:', req.body);
    res.json({ success: true, message: 'Login endpoint reached', received: req.body });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, requireRole('admin', 'teacher'), classController.getClasses);
router.post('/', requireAuth, requireRole('admin'), classController.createClass);
router.delete('/:id', requireAuth, requireRole('admin'), classController.deleteClass);

module.exports = router;

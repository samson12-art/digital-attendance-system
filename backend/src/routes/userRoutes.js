const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Configure multer for profile photos
const photosDir = path.join(__dirname, '../../uploads/photos');
try { fs.mkdirSync(photosDir, { recursive: true }); } catch(e) {}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, photosDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const userId = req.user ? req.user.id : 'unknown';
        cb(null, `user-${userId}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype);
        if (extOk && mimeOk) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

router.get('/students', requireAuth, requireRole('admin', 'teacher'), userController.getStudents);
router.get('/teachers', requireAuth, requireRole('admin'), userController.getTeachers);
router.get('/me', requireAuth, userController.getMyProfile);
router.delete('/:id', requireAuth, requireRole('admin'), userController.deleteUser);
router.get('/:id/courses', requireAuth, userController.getStudentCourses);
router.post('/upload-photo', requireAuth, upload.single('photo'), handleUploadError, userController.uploadProfilePhoto);
router.get('/:id/eligibility', requireAuth, userController.getExamEligibility);

module.exports = router;

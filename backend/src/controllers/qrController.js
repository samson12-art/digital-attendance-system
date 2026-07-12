const QRCode = require('qrcode');
const crypto = require('crypto');
const pool = require('../config/database');

const qrStore = new Map();

function generateTimeBasedCode(classId, validitySeconds = 20) {
    const now = Math.floor(Date.now() / (validitySeconds * 1000));
    const payload = `${classId}-${now}-${process.env.JWT_SECRET || 'qr-secret-key'}`;
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 8).toUpperCase();
}

function isCodeValid(classId, code, validitySeconds = 20) {
    for (let offset = -1; offset <= 1; offset++) {
        const checkTime = Math.floor(Date.now() / (validitySeconds * 1000)) + offset;
        const payload = `${classId}-${checkTime}-${process.env.JWT_SECRET || 'qr-secret-key'}`;
        const expected = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 8).toUpperCase();
        if (expected === code.toUpperCase()) return true;
    }
    return false;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const qrController = {
    async generateQR(req, res) {
        try {
            const { class_id, validity_seconds = 20, latitude, longitude } = req.body;

            if (!class_id) {
                return res.status(400).json({ success: false, message: 'Class ID is required' });
            }

            if (req.user.role === 'teacher') {
                const classCheck = await pool.query('SELECT teacher_id FROM classes WHERE id = $1', [class_id]);
                if (!classCheck.rows[0] || parseInt(classCheck.rows[0].teacher_id) !== parseInt(req.user.id)) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }
            }

            const code = generateTimeBasedCode(class_id, validity_seconds);
            const expiresAt = Date.now() + (validity_seconds * 1000);

            qrStore.set(`class_${class_id}`, {
                code,
                generatedAt: Date.now(),
                expiresAt,
                validity_seconds,
                generatedBy: req.user.id,
                classLat: latitude ? parseFloat(latitude) : null,
                classLng: longitude ? parseFloat(longitude) : null,
                usedStudents: new Set()
            });

            const qrData = JSON.stringify({
                type: 'attendance_checkin',
                class_id: parseInt(class_id),
                code,
                timestamp: Date.now(),
                expires: expiresAt
            });

            const qrImage = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: { dark: '#1a1a2e', light: '#ffffff' }
            });

            res.json({
                success: true,
                code,
                qr_image: qrImage,
                expires_in: validity_seconds,
                expires_at: new Date(expiresAt).toISOString(),
                class_id: parseInt(class_id),
                location_required: !!(latitude && longitude)
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getCurrentCode(req, res) {
        try {
            const { class_id } = req.params;

            const stored = qrStore.get(`class_${class_id}`);
            if (!stored) {
                return res.json({ success: true, active: false, message: 'No active QR code for this class' });
            }

            if (Date.now() > stored.expiresAt) {
                qrStore.delete(`class_${class_id}`);
                return res.json({ success: true, active: false, message: 'QR code has expired' });
            }

            const remaining = Math.ceil((stored.expiresAt - Date.now()) / 1000);

            res.json({
                success: true,
                active: true,
                code: stored.code,
                expires_in: remaining,
                expires_at: new Date(stored.expiresAt).toISOString()
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async checkIn(req, res) {
        try {
            const { class_id, code, latitude, longitude } = req.body;

            if (!class_id || !code) {
                return res.status(400).json({ success: false, message: 'Class ID and code are required' });
            }

            const stored = qrStore.get(`class_${class_id}`);
            if (!stored) {
                return res.status(400).json({ success: false, message: 'No active QR code for this class' });
            }

            if (Date.now() > stored.expiresAt) {
                qrStore.delete(`class_${class_id}`);
                return res.status(400).json({ success: false, message: 'QR code has expired. Please request a new one.' });
            }

            if (!isCodeValid(class_id, code)) {
                return res.status(400).json({ success: false, message: 'Invalid code' });
            }

            const studentId = req.user.id;

            if (stored.usedStudents.has(studentId)) {
                return res.status(400).json({ success: false, message: 'This QR code has already been used by you' });
            }

            if (stored.classLat !== null && stored.classLng !== null) {
                if (latitude == null || longitude == null) {
                    return res.status(400).json({ success: false, message: 'Location required. Please enable GPS and try again.' });
                }
                const distance = haversineDistance(stored.classLat, stored.classLng, parseFloat(latitude), parseFloat(longitude));
                if (distance > 100) {
                    return res.status(400).json({ success: false, message: `You are ${Math.round(distance)}m away from the classroom. You must be within 100m to check in.` });
                }
            }

            const studentCheck = await pool.query(
                'SELECT class_id, section FROM users WHERE id = $1 AND role = $2',
                [studentId, 'student']
            );
            if (!studentCheck.rows[0]) {
                return res.status(400).json({ success: false, message: 'Student not found' });
            }

            const classCheck = await pool.query('SELECT section FROM classes WHERE id = $1', [class_id]);
            if (!classCheck.rows[0]) {
                return res.status(400).json({ success: false, message: 'Class not found' });
            }

            const existing = await pool.query(
                'SELECT id FROM attendance WHERE student_id = $1 AND class_id = $2 AND date = CURRENT_DATE',
                [studentId, class_id]
            );

            if (existing.rows[0]) {
                return res.json({
                    success: true,
                    message: 'Already checked in for today',
                    attendance_id: existing.rows[0].id
                });
            }

            stored.usedStudents.add(studentId);

            const attendance = await pool.query(`
                INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by)
                VALUES ($1, $2, CURRENT_DATE, 'present', CURRENT_TIME, $1)
                ON CONFLICT (student_id, class_id, date) DO NOTHING
                RETURNING *
            `, [studentId, class_id]);

            res.json({
                success: true,
                message: 'Check-in successful',
                attendance: attendance.rows[0] || null,
                check_in_time: new Date().toLocaleTimeString()
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async verifyCode(req, res) {
        try {
            const { class_id, code } = req.body;

            if (!class_id || !code) {
                return res.status(400).json({ success: false, message: 'Class ID and code are required' });
            }

            const stored = qrStore.get(`class_${class_id}`);
            if (!stored) {
                return res.json({ success: false, valid: false, message: 'No active QR code' });
            }

            if (Date.now() > stored.expiresAt) {
                qrStore.delete(`class_${class_id}`);
                return res.json({ success: false, valid: false, message: 'QR code expired' });
            }

            const valid = stored.code.toUpperCase() === code.toUpperCase();
            const remaining = Math.ceil((stored.expiresAt - Date.now()) / 1000);

            res.json({
                success: true,
                valid,
                expires_in: remaining,
                message: valid ? 'Code is valid' : 'Code is invalid'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = qrController;

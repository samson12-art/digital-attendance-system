const nodemailer = require('nodemailer');
const pool = require('../config/database');

let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        });
    }
    return transporter;
}

const notificationController = {
    async sendAttendanceAlert(req, res) {
        try {
            const { student_id, class_id, status, date } = req.body;

            const studentResult = await pool.query(`
                SELECT u.full_name, u.email, c.name as class_name, c.section
                FROM users u
                JOIN classes c ON u.class_id = c.id
                WHERE u.id = $1
            `, [student_id]);

            if (!studentResult.rows[0]) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }

            const student = studentResult.rows[0];

            const emailContent = generateAttendanceEmail(student, status, date);

            if (!process.env.SMTP_USER) {
                console.log('[EMAIL] SMTP not configured. Alert would be sent to:', student.email);
                console.log('[EMAIL] Subject:', emailContent.subject);
                return res.json({
                    success: true,
                    message: 'Email alert queued (SMTP not configured - logged only)',
                    recipient: student.email,
                    subject: emailContent.subject
                });
            }

            await getTransporter().sendMail({
                from: process.env.SMTP_FROM || '"Digital Attendance" <noreply@attendance.com>',
                to: student.email,
                subject: emailContent.subject,
                html: emailContent.html
            });

            res.json({ success: true, message: 'Attendance alert sent', recipient: student.email });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async sendLowAttendanceWarning(req, res) {
        try {
            const { student_id } = req.body;

            const studentResult = await pool.query(`
                SELECT u.full_name, u.email, c.name as class_name, c.section,
                    COUNT(a.id) as total_classes,
                    COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) as attended,
                    ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as percentage
                FROM users u
                JOIN classes c ON u.class_id = c.id
                LEFT JOIN attendance a ON u.id = a.student_id AND c.id = a.class_id
                WHERE u.id = $1
                GROUP BY u.full_name, u.email, c.name, c.section
            `, [student_id]);

            if (!studentResult.rows[0]) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }

            const student = studentResult.rows[0];
            const percentage = parseFloat(student.percentage) || 0;

            if (percentage >= 75) {
                return res.json({
                    success: true,
                    message: 'Student attendance is above 75% threshold',
                    percentage
                });
            }

            const emailContent = generateLowAttendanceEmail(student);

            if (!process.env.SMTP_USER) {
                console.log('[EMAIL] SMTP not configured. Low attendance warning would be sent to:', student.email);
                return res.json({
                    success: true,
                    message: 'Low attendance warning queued (SMTP not configured - logged only)',
                    recipient: student.email,
                    percentage
                });
            }

            await getTransporter().sendMail({
                from: process.env.SMTP_FROM || '"Digital Attendance" <noreply@attendance.com>',
                to: student.email,
                subject: emailContent.subject,
                html: emailContent.html
            });

            res.json({ success: true, message: 'Low attendance warning sent', recipient: student.email, percentage });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async sendBulkLowAttendanceWarnings(req, res) {
        try {
            const { threshold = 75 } = req.body;

            const lowStudents = await pool.query(`
                SELECT u.id, u.full_name, u.email, c.name as class_name, c.section,
                    COUNT(a.id) as total_classes,
                    COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) as attended,
                    ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as percentage
                FROM users u
                JOIN classes c ON u.class_id = c.id
                LEFT JOIN attendance a ON u.id = a.student_id AND c.id = a.class_id
                WHERE u.role = 'student' AND u.is_active = true
                GROUP BY u.id, u.full_name, u.email, c.name, c.section
                HAVING ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) < $1
                    OR COUNT(a.id) = 0
            `, [threshold]);

            let sent = 0;
            let failed = 0;
            const recipients = [];

            for (const student of lowStudents.rows) {
                try {
                    if (process.env.SMTP_USER) {
                        const emailContent = generateLowAttendanceEmail(student);
                        await getTransporter().sendMail({
                            from: process.env.SMTP_FROM || '"Digital Attendance" <noreply@attendance.com>',
                            to: student.email,
                            subject: emailContent.subject,
                            html: emailContent.html
                        });
                        sent++;
                    } else {
                        console.log(`[EMAIL] Would send to: ${student.email} (${student.percentage || 0}%)`);
                        sent++;
                    }
                    recipients.push({ email: student.email, percentage: student.percentage });
                } catch (err) {
                    console.error(`[EMAIL] Failed to send to ${student.email}:`, err.message);
                    failed++;
                }
            }

            res.json({
                success: true,
                message: `Bulk warnings processed. Sent: ${sent}, Failed: ${failed}`,
                total_below_threshold: lowStudents.rows.length,
                sent,
                failed,
                recipients
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getLowAttendanceStudents(req, res) {
        try {
            const { threshold = 75 } = req.query;
            const result = await pool.query(`
                SELECT u.id, u.full_name, u.email, c.name as class_name, c.section,
                    COUNT(a.id) as total_classes,
                    COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) as attended,
                    COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
                    ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as percentage
                FROM users u
                JOIN classes c ON u.class_id = c.id
                LEFT JOIN attendance a ON u.id = a.student_id AND c.id = a.class_id
                WHERE u.role = 'student' AND u.is_active = true
                GROUP BY u.id, u.full_name, u.email, c.name, c.section
                HAVING ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) < $1
                    OR COUNT(a.id) = 0
                ORDER BY percentage ASC
            `, [threshold]);

            res.json({ success: true, students: result.rows, threshold });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async testEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            if (!process.env.SMTP_USER) {
                return res.json({
                    success: true,
                    message: 'SMTP not configured. Test email logged only.',
                    recipient: email
                });
            }

            await getTransporter().sendMail({
                from: process.env.SMTP_FROM || '"Digital Attendance" <noreply@attendance.com>',
                to: email,
                subject: 'Test Email - Digital Attendance System',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #4F46E5;">Digital Attendance System</h2>
                        <p>This is a test email notification.</p>
                        <p>Your email has been configured correctly for receiving attendance alerts.</p>
                        <hr style="border: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 12px;">If you received this email in error, please contact your administrator.</p>
                    </div>
                `
            });

            res.json({ success: true, message: 'Test email sent successfully', recipient: email });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

function generateAttendanceEmail(student, status, date) {
    const statusText = {
        present: 'Present',
        absent: 'Absent',
        late: 'Late',
        excused: 'Excused'
    };

    const statusColor = {
        present: '#22C55E',
        absent: '#EF4444',
        late: '#F59E0B',
        excused: '#8B5CF6'
    };

    return {
        subject: `Attendance ${statusText[status] || status} - ${student.class_name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="background: #4F46E5; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">Digital Attendance System</h1>
                </div>
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1f2937; margin-top: 0;">Attendance Notification</h2>
                    <p style="color: #4b5563;">Dear Parent/Guardian,</p>
                    <p style="color: #4b5563;">This is to inform you about the attendance status of <strong>${student.full_name}</strong>.</p>
                    <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
                        <p style="margin: 4px 0;"><strong>Student:</strong> ${student.full_name}</p>
                        <p style="margin: 4px 0;"><strong>Class:</strong> ${student.class_name} - Section ${student.section}</p>
                        <p style="margin: 4px 0;"><strong>Date:</strong> ${date || new Date().toLocaleDateString()}</p>
                        <p style="margin: 4px 0;"><strong>Status:</strong> 
                            <span style="color: ${statusColor[status]}; font-weight: bold;">${statusText[status] || status}</span>
                        </p>
                    </div>
                    <p style="color: #6b7280; font-size: 12px;">This is an automated notification from the Digital Attendance System.</p>
                </div>
            </div>
        `
    };
}

function generateLowAttendanceEmail(student) {
    return {
        subject: `Low Attendance Warning - ${student.full_name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="background: #EF4444; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">Digital Attendance System</h1>
                </div>
                <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca;">
                    <h2 style="color: #991b1b; margin-top: 0;">Low Attendance Warning</h2>
                    <p style="color: #4b5563;">Dear Parent/Guardian,</p>
                    <p style="color: #4b5563;">This is to alert you that <strong>${student.full_name}</strong> has a low attendance record.</p>
                    <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #fecaca;">
                        <p style="margin: 4px 0;"><strong>Student:</strong> ${student.full_name}</p>
                        <p style="margin: 4px 0;"><strong>Class:</strong> ${student.class_name} - Section ${student.section}</p>
                        <p style="margin: 4px 0;"><strong>Total Classes:</strong> ${student.total_classes}</p>
                        <p style="margin: 4px 0;"><strong>Classes Attended:</strong> ${student.attended}</p>
                        <p style="margin: 4px 0;"><strong>Attendance Rate:</strong> 
                            <span style="color: #EF4444; font-weight: bold;">${student.percentage || 0}%</span>
                        </p>
                    </div>
                    <p style="color: #991b1b; font-weight: bold;">Minimum required attendance is 75%.</p>
                    <p style="color: #6b7280; font-size: 12px;">This is an automated warning from the Digital Attendance System.</p>
                </div>
            </div>
        `
    };
}

module.exports = notificationController;

const pool = require('../config/database');
const logger = require('../utils/logger');

class Attendance {
    static async getById(id) {
        try {
            const result = await pool.query('SELECT * FROM attendance WHERE id = $1', [id]);
            return result.rows[0];
        } catch (error) {
            logger.error(`getById error: ${error.message}`);
            throw error;
        }
    }

    static async markAttendance(data) {
        try {
            const { 
                student_id, course_id, status, 
                check_in_time, check_out_time, 
                marked_by, remarks, latitude, longitude 
            } = data;

            const result = await pool.query(
                `INSERT INTO attendance (student_id, course_id, date, status, check_in_time, check_out_time, marked_by, remarks, latitude, longitude)
                 VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (student_id, course_id, date) 
                 DO UPDATE SET 
                    status = EXCLUDED.status,
                    check_in_time = COALESCE(EXCLUDED.check_in_time, attendance.check_in_time),
                    check_out_time = EXCLUDED.check_out_time,
                    marked_by = EXCLUDED.marked_by,
                    remarks = EXCLUDED.remarks,
                    latitude = COALESCE(EXCLUDED.latitude, attendance.latitude),
                    longitude = COALESCE(EXCLUDED.longitude, attendance.longitude)
                 RETURNING *`,
                [student_id, course_id, status, check_in_time, check_out_time, marked_by, remarks, latitude, longitude]
            );

            logger.info(`Attendance marked: Student ${student_id} - ${status}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`markAttendance error: ${error.message}`);
            throw error;
        }
    }

    static async getAttendanceByStudent(studentId, courseId = null, startDate = null, endDate = null) {
        try {
            let query = `
                SELECT a.*, c.course_name, c.course_code, c.section_id, s.section_code, u.full_name as marked_by_name
                FROM attendance a
                JOIN courses c ON a.course_id = c.id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN users u ON a.marked_by = u.id
                WHERE a.student_id = $1
            `;
            const params = [studentId];
            let paramCount = 2;

            if (courseId) {
                query += ` AND a.course_id = $${paramCount}`;
                params.push(courseId);
                paramCount++;
            }

            if (startDate) {
                query += ` AND a.date >= $${paramCount}`;
                params.push(startDate);
                paramCount++;
            }

            if (endDate) {
                query += ` AND a.date <= $${paramCount}`;
                params.push(endDate);
                paramCount++;
            }

            query += ' ORDER BY a.date DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error(`getAttendanceByStudent error: ${error.message}`);
            throw error;
        }
    }

    static async getAttendanceByCourse(courseId, date = null) {
        try {
            let query = `
                SELECT 
                    a.*, 
                    u.id as student_id,
                    u.full_name as student_name, 
                    u.username,
                    u.email,
                    s.section_code
                FROM attendance a
                RIGHT JOIN users u ON a.student_id = u.id
                LEFT JOIN courses c ON a.course_id = c.id
                LEFT JOIN sections s ON c.section_id = s.id
                JOIN enrollments e ON u.id = e.student_id AND e.course_id = $1
                WHERE u.role = 'student' AND u.is_active = true
            `;
            const params = [courseId];

            if (date) {
                query += ' AND a.date = $2';
                params.push(date);
            } else {
                query += ' AND a.date = CURRENT_DATE';
            }

            query += ' ORDER BY u.full_name';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error(`getAttendanceByCourse error: ${error.message}`);
            throw error;
        }
    }

    static async getAttendanceStats(studentId, courseId = null) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'present') as present,
                    COUNT(*) FILTER (WHERE status = 'absent') as absent,
                    COUNT(*) FILTER (WHERE status = 'late') as late,
                    COUNT(*) FILTER (WHERE status = 'excused') as excused
                FROM attendance
                WHERE student_id = $1
            `;
            const params = [studentId];

            if (courseId) {
                query += ' AND course_id = $2';
                params.push(courseId);
            }

            const result = await pool.query(query, params);
            return result.rows[0];
        } catch (error) {
            logger.error(`getAttendanceStats error: ${error.message}`);
            throw error;
        }
    }

    static async getTodayAttendance(courseId) {
        try {
            return this.getAttendanceByCourse(courseId, new Date().toISOString().split('T')[0]);
        } catch (error) {
            logger.error(`getTodayAttendance error: ${error.message}`);
            throw error;
        }
    }

    static async updateAttendance(id, data) {
        try {
            const { status, check_in_time, check_out_time, remarks } = data;
            const result = await pool.query(
                `UPDATE attendance 
                 SET status = COALESCE($1, status),
                     check_in_time = COALESCE($2, check_in_time),
                     check_out_time = COALESCE($3, check_out_time),
                     remarks = COALESCE($4, remarks)
                 WHERE id = $5 
                 RETURNING *`,
                [status, check_in_time, check_out_time, remarks, id]
            );
            return result.rows[0];
        } catch (error) {
            logger.error(`updateAttendance error: ${error.message}`);
            throw error;
        }
    }

    static async getAttendanceSummary(studentId) {
        try {
            const result = await pool.query(`
                SELECT 
                    c.id as course_id,
                    c.course_code,
                    c.course_name,
                    s.section_code,
                    COUNT(a.id) as total_classes,
                    COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
                    COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
                    COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
                    COUNT(a.id) FILTER (WHERE a.status = 'excused') as excused_count,
                    ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as attendance_percentage
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN attendance a ON c.id = a.course_id AND a.student_id = $1
                WHERE e.student_id = $1 AND e.status = 'active'
                GROUP BY c.id, c.course_code, c.course_name, s.section_code
                ORDER BY c.course_code
            `, [studentId]);
            return result.rows;
        } catch (error) {
            logger.error(`getAttendanceSummary error: ${error.message}`);
            throw error;
        }
    }

    static async getCourseAttendanceSummary(courseId) {
        try {
            const result = await pool.query(`
                SELECT 
                    u.id as student_id,
                    u.full_name as student_name,
                    u.username,
                    COUNT(a.id) as total_classes,
                    COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
                    COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
                    COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
                    COUNT(a.id) FILTER (WHERE a.status = 'excused') as excused_count,
                    ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as attendance_percentage
                FROM users u
                JOIN enrollments e ON u.id = e.student_id
                LEFT JOIN attendance a ON u.id = a.student_id AND a.course_id = $1
                WHERE e.course_id = $1 AND u.role = 'student' AND u.is_active = true
                GROUP BY u.id, u.full_name, u.username
                ORDER BY u.full_name
            `, [courseId]);
            return result.rows;
        } catch (error) {
            logger.error(`getCourseAttendanceSummary error: ${error.message}`);
            throw error;
        }
    }

    static async getDailyReport(date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            const result = await pool.query(`
                SELECT 
                    c.course_code,
                    c.course_name,
                    s.section_code,
                    COUNT(DISTINCT a.student_id) as total_students,
                    COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'present') as present,
                    COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'absent') as absent,
                    COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'late') as late,
                    ROUND(CAST(COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'present') AS DECIMAL) / NULLIF(COUNT(DISTINCT a.student_id), 0) * 100, 2) as attendance_rate
                FROM courses c
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN attendance a ON c.id = a.course_id AND a.date = $1
                GROUP BY c.id, c.course_code, c.course_name, s.section_code
                ORDER BY c.course_code
            `, [targetDate]);
            return result.rows;
        } catch (error) {
            logger.error(`getDailyReport error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = Attendance;
module.exports = { /* Course model */ } 
const pool = require('../config/database');
const logger = require('../utils/logger');

class Course {
    static async create(courseData) {
        try {
            const { course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours } = courseData;
            const result = await pool.query(
                `INSERT INTO courses (course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours || 3]
            );
            logger.info(`Course created: ${course_code}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`create course error: ${error.message}`);
            throw error;
        }
    }

    static async getAll() {
        try {
            const result = await pool.query(`
                SELECT 
                    c.*, 
                    u.full_name as teacher_name,
                    s.section_code,
                    s.section_name,
                    COUNT(DISTINCT e.student_id) as student_count,
                    json_agg(DISTINCT jsonb_build_object(
                        'day', cs.day,
                        'start_time', cs.start_time,
                        'end_time', cs.end_time,
                        'room', cs.room,
                        'is_lab', cs.is_lab
                    )) FILTER (WHERE cs.id IS NOT NULL) as schedule
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN course_schedules cs ON c.id = cs.course_id
                GROUP BY c.id, u.full_name, s.section_code, s.section_name
                ORDER BY c.course_code
            `);
            return result.rows;
        } catch (error) {
            logger.error(`getAll courses error: ${error.message}`);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const result = await pool.query(`
                SELECT 
                    c.*, 
                    u.full_name as teacher_name,
                    s.section_code,
                    s.section_name,
                    COUNT(DISTINCT e.student_id) as student_count,
                    json_agg(DISTINCT jsonb_build_object(
                        'day', cs.day,
                        'start_time', cs.start_time,
                        'end_time', cs.end_time,
                        'room', cs.room,
                        'is_lab', cs.is_lab
                    )) FILTER (WHERE cs.id IS NOT NULL) as schedule
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN course_schedules cs ON c.id = cs.course_id
                WHERE c.id = $1
                GROUP BY c.id, u.full_name, s.section_code, s.section_name
            `, [id]);
            return result.rows[0];
        } catch (error) {
            logger.error(`getById course error: ${error.message}`);
            throw error;
        }
    }

    static async getByTeacher(teacherId) {
        try {
            const result = await pool.query(`
                SELECT 
                    c.*, 
                    u.full_name as teacher_name,
                    s.section_code,
                    s.section_name,
                    COUNT(DISTINCT e.student_id) as student_count,
                    json_agg(DISTINCT jsonb_build_object(
                        'day', cs.day,
                        'start_time', cs.start_time,
                        'end_time', cs.end_time,
                        'room', cs.room,
                        'is_lab', cs.is_lab
                    )) FILTER (WHERE cs.id IS NOT NULL) as schedule
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN course_schedules cs ON c.id = cs.course_id
                WHERE c.teacher_id = $1
                GROUP BY c.id, u.full_name, s.section_code, s.section_name
                ORDER BY c.course_code
            `, [teacherId]);
            return result.rows;
        } catch (error) {
            logger.error(`getByTeacher course error: ${error.message}`);
            throw error;
        }
    }

    static async getBySection(sectionId) {
        try {
            const result = await pool.query(`
                SELECT 
                    c.*, 
                    u.full_name as teacher_name,
                    s.section_code,
                    s.section_name,
                    COUNT(DISTINCT e.student_id) as student_count,
                    json_agg(DISTINCT jsonb_build_object(
                        'day', cs.day,
                        'start_time', cs.start_time,
                        'end_time', cs.end_time,
                        'room', cs.room,
                        'is_lab', cs.is_lab
                    )) FILTER (WHERE cs.id IS NOT NULL) as schedule
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN course_schedules cs ON c.id = cs.course_id
                WHERE c.section_id = $1
                GROUP BY c.id, u.full_name, s.section_code, s.section_name
                ORDER BY c.course_code
            `, [sectionId]);
            return result.rows;
        } catch (error) {
            logger.error(`getBySection course error: ${error.message}`);
            throw error;
        }
    }

    static async update(id, courseData) {
        try {
            const { course_name, description, teacher_id, section_id, semester, academic_year, credit_hours } = courseData;
            const result = await pool.query(
                `UPDATE courses 
                 SET course_name = COALESCE($1, course_name),
                     description = COALESCE($2, description),
                     teacher_id = COALESCE($3, teacher_id),
                     section_id = COALESCE($4, section_id),
                     semester = COALESCE($5, semester),
                     academic_year = COALESCE($6, academic_year),
                     credit_hours = COALESCE($7, credit_hours),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8 
                 RETURNING *`,
                [course_name, description, teacher_id, section_id, semester, academic_year, credit_hours, id]
            );
            return result.rows[0];
        } catch (error) {
            logger.error(`update course error: ${error.message}`);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
            return result.rowCount > 0;
        } catch (error) {
            logger.error(`delete course error: ${error.message}`);
            throw error;
        }
    }

    static async enrollStudent(studentId, courseId) {
        try {
            const result = await pool.query(
                `INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING id`,
                [studentId, courseId]
            );
            logger.info(`Student ${studentId} enrolled in course ${courseId}`);
            return result.rows[0].id;
        } catch (error) {
            if (error.code === '23505') {
                throw new Error('Student already enrolled in this course');
            }
            logger.error(`enrollStudent error: ${error.message}`);
            throw error;
        }
    }

    static async getStudentCourses(studentId) {
        try {
            const result = await pool.query(`
                SELECT 
                    c.*, 
                    u.full_name as teacher_name,
                    s.section_code,
                    s.section_name,
                    json_agg(DISTINCT jsonb_build_object(
                        'day', cs.day,
                        'start_time', cs.start_time,
                        'end_time', cs.end_time,
                        'room', cs.room,
                        'is_lab', cs.is_lab
                    )) FILTER (WHERE cs.id IS NOT NULL) as schedule
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN sections s ON c.section_id = s.id
                LEFT JOIN course_schedules cs ON c.id = cs.course_id
                WHERE e.student_id = $1 AND e.status = 'active'
                GROUP BY c.id, u.full_name, s.section_code, s.section_name
                ORDER BY c.course_code
            `, [studentId]);
            return result.rows;
        } catch (error) {
            logger.error(`getStudentCourses error: ${error.message}`);
            throw error;
        }
    }

    static async getEnrolledStudents(courseId) {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, u.email, u.full_name, e.enrollment_date, e.status
                FROM users u
                JOIN enrollments e ON u.id = e.student_id
                WHERE e.course_id = $1 AND u.role = 'student' AND u.is_active = true
                ORDER BY u.full_name
            `, [courseId]);
            return result.rows;
        } catch (error) {
            logger.error(`getEnrolledStudents error: ${error.message}`);
            throw error;
        }
    }

    static async getAvailableCourses(studentId) {
        try {
            const result = await pool.query(`
                SELECT c.*, u.full_name as teacher_name, s.section_code
                FROM courses c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN sections s ON c.section_id = s.id
                WHERE c.id NOT IN (
                    SELECT course_id FROM enrollments 
                    WHERE student_id = $1 AND status = 'active'
                )
                ORDER BY c.course_code
            `, [studentId]);
            return result.rows;
        } catch (error) {
            logger.error(`getAvailableCourses error: ${error.message}`);
            throw error;
        }
    }

    static async getSections() {
        try {
            const result = await pool.query('SELECT * FROM sections ORDER BY section_code');
            return result.rows;
        } catch (error) {
            logger.error(`getSections error: ${error.message}`);
            throw error;
        }
    }

    static async getCourseSchedule(courseId) {
        try {
            const result = await pool.query(`
                SELECT * FROM course_schedules WHERE course_id = $1 ORDER BY day, start_time
            `, [courseId]);
            return result.rows;
        } catch (error) {
            logger.error(`getCourseSchedule error: ${error.message}`);
            throw error;
        }
    }

    static async getStudentCount(courseId) {
        try {
            const result = await pool.query(
                'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1 AND status = \'active\'',
                [courseId]
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error(`getStudentCount error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = Course;
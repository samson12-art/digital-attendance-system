const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class User {
    static async findByUsername(username) {
        try {
            console.log('🔍 findByUsername called with:', username);
            const result = await pool.query(
                'SELECT * FROM users WHERE username = $1 AND is_active = true',
                [username]
            );
            console.log('🔍 User found:', result.rows.length > 0 ? 'YES' : 'NO');
            if (result.rows.length > 0) {
                console.log('🔍 User role:', result.rows[0].role);
                console.log('🔍 User password hash:', result.rows[0].password.substring(0, 30) + '...');
            }
            return result.rows[0];
        } catch (error) {
            console.error('❌ findByUsername error:', error.message);
            logger.error(`findByUsername error: ${error.message}`);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const result = await pool.query(
                `SELECT id, username, email, full_name, role, is_active, last_login, created_at 
                 FROM users WHERE id = $1 AND is_active = true`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            logger.error(`findById error: ${error.message}`);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1 AND is_active = true',
                [email]
            );
            return result.rows[0];
        } catch (error) {
            logger.error(`findByEmail error: ${error.message}`);
            throw error;
        }
    }

    static async create(userData) {
        try {
            const { username, password, email, full_name, role } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('🔐 Creating user:', username);
            console.log('🔐 Hashed password:', hashedPassword);
            const result = await pool.query(
                `INSERT INTO users (username, password, email, full_name, role) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, role`,
                [username, hashedPassword, email, full_name, role]
            );
            logger.info(`User created: ${username} (${role})`);
            return result.rows[0];
        } catch (error) {
            logger.error(`create error: ${error.message}`);
            throw error;
        }
    }

    static async getAll() {
        try {
            const result = await pool.query(
                `SELECT id, username, email, full_name, role, is_active, last_login, created_at 
                 FROM users ORDER BY id`
            );
            return result.rows;
        } catch (error) {
            logger.error(`getAll error: ${error.message}`);
            throw error;
        }
    }

    static async update(id, userData) {
        try {
            const { email, full_name, role, is_active } = userData;
            const result = await pool.query(
                `UPDATE users 
                 SET email = COALESCE($1, email), 
                     full_name = COALESCE($2, full_name), 
                     role = COALESCE($3, role),
                     is_active = COALESCE($4, is_active),
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $5 
                 RETURNING id, username, email, full_name, role, is_active`,
                [email, full_name, role, is_active, id]
            );
            return result.rows[0];
        } catch (error) {
            logger.error(`update error: ${error.message}`);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await pool.query(
                'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            logger.error(`delete error: ${error.message}`);
            throw error;
        }
    }

    static async getStudents() {
        try {
            const result = await pool.query(
                `SELECT id, username, email, full_name, created_at 
                 FROM users WHERE role = 'student' AND is_active = true 
                 ORDER BY full_name`
            );
            return result.rows;
        } catch (error) {
            logger.error(`getStudents error: ${error.message}`);
            throw error;
        }
    }

    static async getTeachers() {
        try {
            const result = await pool.query(
                `SELECT id, username, email, full_name, created_at 
                 FROM users WHERE role = 'teacher' AND is_active = true 
                 ORDER BY full_name`
            );
            return result.rows;
        } catch (error) {
            logger.error(`getTeachers error: ${error.message}`);
            throw error;
        }
    }

    static async updateLastLogin(id) {
        try {
            await pool.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );
            console.log('✅ Last login updated for user:', id);
        } catch (error) {
            logger.error(`updateLastLogin error: ${error.message}`);
        }
    }

    static async comparePassword(plainPassword, hashedPassword) {
        console.log('🔐 comparePassword called');
        console.log('   Plain password: "' + plainPassword + '"');
        console.log('   Hashed password: "' + hashedPassword + '"');
        try {
            const result = await bcrypt.compare(plainPassword, hashedPassword);
            console.log('   Result:', result);
            return result;
        } catch (error) {
            console.error('❌ comparePassword error:', error.message);
            throw error;
        }
    }

    static async getDashboardStats() {
        try {
            const result = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
                    (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_active = true) as total_teachers,
                    (SELECT COUNT(*) FROM courses) as total_courses,
                    (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'present') as present_today,
                    (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'absent') as absent_today,
                    (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE) as total_today
            `);
            return result.rows[0];
        } catch (error) {
            logger.error(`getDashboardStats error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = User;
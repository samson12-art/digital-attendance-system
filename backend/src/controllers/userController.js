const UserModel = require('../models/userModel');
const path = require('path');
const fs = require('fs');

const userController = {
    async getStudents(req, res) {
        try {
            const students = await UserModel.getAllStudents();
            res.json({ success: true, students });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getTeachers(req, res) {
        try {
            const teachers = await UserModel.getAllTeachers();
            res.json({ success: true, teachers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async deleteUser(req, res) {
        try {
            await UserModel.deactivateUser(req.params.id);
            res.json({ success: true, message: 'User deactivated' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getTeacherStudents(req, res) {
        try {
            const teacherId = req.query.teacher_id;
            if (!teacherId) {
                return res.status(400).json({ success: false, message: 'Teacher ID required' });
            }
            if (req.user.role === 'teacher' && parseInt(req.user.id) !== parseInt(teacherId)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            const students = await UserModel.getTeacherStudents(teacherId);
            res.json({ success: true, students });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getTeacherClasses(req, res) {
        try {
            const teacherId = req.query.teacher_id;
            if (!teacherId) {
                return res.status(400).json({ success: false, message: 'Teacher ID required' });
            }
            if (req.user.role === 'teacher' && parseInt(req.user.id) !== parseInt(teacherId)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            const classes = await UserModel.getTeacherClasses(teacherId);
            res.json({ success: true, classes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getStudentCourses(req, res) {
        try {
            const { id } = req.params;
            if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(id)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            const courses = await UserModel.getStudentCourses(id);
            res.json({ success: true, courses });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async uploadProfilePhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No image file provided' });
            }
            const userId = req.user.id;
            const photoFilename = req.file.filename;
            const result = await UserModel.updateProfilePhoto(userId, photoFilename);
            res.json({ success: true, message: 'Profile photo updated', photo: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getMyProfile(req, res) {
        try {
            const profile = await UserModel.getUserProfile(req.user.id);
            if (!profile) return res.status(404).json({ success: false, message: 'User not found' });
            res.json({ success: true, user: profile });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getExamEligibility(req, res) {
        try {
            const studentId = req.params.id || req.user.id;
            if (req.user.role === 'student' && parseInt(req.user.id) !== parseInt(studentId)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
            const eligibility = await UserModel.getExamEligibility(studentId);
            const overallEligible = eligibility.length === 0 || eligibility.every(e => e.eligible_for_exam);
            res.json({ success: true, eligibility, overallEligible });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = userController;

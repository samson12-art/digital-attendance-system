const ClassModel = require('../models/classModel');

const classController = {
    async getClasses(req, res) {
        try {
            const classes = await ClassModel.getAll();
            res.json({ success: true, classes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async createClass(req, res) {
        try {
            const { name, section, year, semester, teacher_id } = req.body;
            if (!name || !section || !year || !semester) {
                return res.status(400).json({ success: false, message: 'Name, section, year, and semester are required' });
            }
            const cls = await ClassModel.create(name, section, year, semester, teacher_id);
            res.json({ success: true, class: cls });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async deleteClass(req, res) {
        try {
            await ClassModel.delete(req.params.id);
            res.json({ success: true, message: 'Class deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = classController;

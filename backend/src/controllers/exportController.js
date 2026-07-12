const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const path = require('path');

const exportController = {
    async exportAttendanceExcel(req, res) {
        try {
            const { class_id, start_date, end_date } = req.query;
            let query = `
                SELECT a.*, u.full_name as student_name, u.username,
                       c.name as class_name, c.section as class_section
                FROM attendance a
                JOIN users u ON a.student_id = u.id
                JOIN classes c ON a.class_id = c.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (class_id) {
                query += ` AND a.class_id = $${paramIndex++}`;
                params.push(class_id);
            }
            if (start_date) {
                query += ` AND a.date >= $${paramIndex++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND a.date <= $${paramIndex++}`;
                params.push(end_date);
            }

            query += ' ORDER BY a.date DESC, u.full_name';
            const result = await pool.query(query, params);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Digital Attendance System';
            workbook.created = new Date();

            const sheet = workbook.addWorksheet('Attendance Records', {
                properties: { defaultColWidth: 18 }
            });

            sheet.columns = [
                { header: 'Student Name', key: 'student_name', width: 30 },
                { header: 'Username', key: 'username', width: 18 },
                { header: 'Class', key: 'class_name', width: 25 },
                { header: 'Section', key: 'class_section', width: 10 },
                { header: 'Date', key: 'date', width: 14 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Check-in Time', key: 'check_in_time', width: 14 },
                { header: 'Remarks', key: 'remarks', width: 25 }
            ];

            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            headerRow.alignment = { horizontal: 'center' };

            result.rows.forEach(row => {
                const statusColors = {
                    present: 'FF22C55E',
                    absent: 'FFEF4444',
                    late: 'FFF59E0B',
                    excused: 'FF8B5CF6'
                };
                const dataRow = sheet.addRow({
                    student_name: row.student_name,
                    username: row.username,
                    class_name: row.class_name,
                    class_section: row.class_section,
                    date: row.date ? new Date(row.date).toLocaleDateString() : '',
                    status: row.status,
                    check_in_time: row.check_in_time || '',
                    remarks: row.remarks || ''
                });
                const statusCell = dataRow.getCell('status');
                statusCell.font = { bold: true, color: { argb: statusColors[row.status] || 'FF000000' } };
            });

            const summarySheet = workbook.addWorksheet('Summary');
            summarySheet.columns = [
                { header: 'Metric', key: 'metric', width: 25 },
                { header: 'Value', key: 'value', width: 20 }
            ];
            const summaryHeader = summarySheet.getRow(1);
            summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

            const total = result.rows.length;
            const present = result.rows.filter(r => r.status === 'present').length;
            const absent = result.rows.filter(r => r.status === 'absent').length;
            const late = result.rows.filter(r => r.status === 'late').length;
            const excused = result.rows.filter(r => r.status === 'excused').length;

            summarySheet.addRow({ metric: 'Total Records', value: total });
            summarySheet.addRow({ metric: 'Present', value: present });
            summarySheet.addRow({ metric: 'Absent', value: absent });
            summarySheet.addRow({ metric: 'Late', value: late });
            summarySheet.addRow({ metric: 'Excused', value: excused });
            summarySheet.addRow({ metric: 'Attendance Rate', value: total > 0 ? `${((present + late) / total * 100).toFixed(1)}%` : 'N/A' });
            summarySheet.addRow({ metric: 'Generated', value: new Date().toLocaleString() });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=attendance_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async exportAttendancePDF(req, res) {
        try {
            const { class_id, start_date, end_date } = req.query;
            let query = `
                SELECT a.*, u.full_name as student_name, u.username,
                       c.name as class_name, c.section as class_section
                FROM attendance a
                JOIN users u ON a.student_id = u.id
                JOIN classes c ON a.class_id = c.id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (class_id) {
                query += ` AND a.class_id = $${paramIndex++}`;
                params.push(class_id);
            }
            if (start_date) {
                query += ` AND a.date >= $${paramIndex++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND a.date <= $${paramIndex++}`;
                params.push(end_date);
            }

            query += ' ORDER BY a.date DESC, u.full_name';
            const result = await pool.query(query, params);

            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=attendance_${new Date().toISOString().split('T')[0]}.pdf`);
            doc.pipe(res);

            doc.fontSize(20).font('Helvetica-Bold').text('Attendance Report', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            if (class_id) {
                doc.text(`Class ID: ${class_id}`, { align: 'center' });
            }
            if (start_date || end_date) {
                doc.text(`Period: ${start_date || 'Start'} to ${end_date || 'End'}`, { align: 'center' });
            }
            doc.moveDown(0.8);

            const total = result.rows.length;
            const present = result.rows.filter(r => r.status === 'present').length;
            const absent = result.rows.filter(r => r.status === 'absent').length;
            const late = result.rows.filter(r => r.status === 'late').length;
            const excused = result.rows.filter(r => r.status === 'excused').length;

            doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
                .text('Summary:', { underline: true });
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica');
            doc.text(`Total Records: ${total}    |    Present: ${present}    |    Absent: ${absent}    |    Late: ${late}    |    Excused: ${excused}`);
            doc.text(`Attendance Rate: ${total > 0 ? ((present + late) / total * 100).toFixed(1) : 'N/A'}%`);
            doc.moveDown(0.5);

            const tableTop = doc.y;
            const colWidths = [30, 160, 80, 120, 80, 70, 80, 100, 120];
            const headers = ['#', 'Student Name', 'Username', 'Class', 'Section', 'Date', 'Status', 'Check-in', 'Remarks'];
            const startX = 40;

            doc.fontSize(8).font('Helvetica-Bold');
            let x = startX;
            headers.forEach((h, i) => {
                doc.fillColor('#4F46E5');
                doc.rect(x, tableTop, colWidths[i], 18).fill();
                doc.fillColor('#FFFFFF').text(h, x + 4, tableTop + 4, { width: colWidths[i] - 8 });
                x += colWidths[i];
            });

            doc.font('Helvetica').fontSize(7);
            const maxRows = Math.min(result.rows.length, 40);
            for (let i = 0; i < maxRows; i++) {
                const row = result.rows[i];
                const y = tableTop + 18 + (i * 14);
                if (y > 530) {
                    doc.addPage();
                    break;
                }
                const bgColor = i % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
                x = startX;
                colWidths.forEach((w) => {
                    doc.fillColor(bgColor).rect(x, y, w, 14).fill();
                    x += w;
                });

                const rowData = [
                    String(i + 1),
                    row.student_name || '',
                    row.username || '',
                    row.class_name || '',
                    row.class_section || '',
                    row.date ? new Date(row.date).toLocaleDateString() : '',
                    row.status || '',
                    row.check_in_time || '',
                    (row.remarks || '').substring(0, 20)
                ];

                x = startX;
                doc.fillColor('#000000');
                rowData.forEach((cell, ci) => {
                    doc.text(cell, x + 4, y + 3, { width: colWidths[ci] - 8, lineBreak: false });
                    x += colWidths[ci];
                });
            }

            if (result.rows.length > maxRows) {
                doc.moveDown(0.5);
                doc.fontSize(9).fillColor('#666666')
                    .text(`... and ${result.rows.length - maxRows} more records`, { align: 'center' });
            }

            doc.end();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async exportStudentsExcel(req, res) {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, u.full_name, u.email, u.role,
                       c.name as class_name, c.section as class_section,
                       u.department, u.entry_year, u.is_active
                FROM users u
                LEFT JOIN classes c ON u.class_id = c.id
                WHERE u.role = 'student'
                ORDER BY u.full_name
            `);

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Students');

            sheet.columns = [
                { header: 'ID', key: 'id', width: 8 },
                { header: 'Username', key: 'username', width: 18 },
                { header: 'Full Name', key: 'full_name', width: 30 },
                { header: 'Email', key: 'email', width: 28 },
                { header: 'Class', key: 'class_name', width: 25 },
                { header: 'Section', key: 'class_section', width: 10 },
                { header: 'Department', key: 'department', width: 18 },
                { header: 'Entry Year', key: 'entry_year', width: 12 },
                { header: 'Status', key: 'status', width: 10 }
            ];

            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

            result.rows.forEach(row => {
                sheet.addRow({
                    ...row,
                    status: row.is_active ? 'Active' : 'Inactive'
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=students_${new Date().toISOString().split('T')[0]}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async exportStudentsPDF(req, res) {
        try {
            const result = await pool.query(`
                SELECT u.id, u.username, u.full_name, u.email,
                       c.name as class_name, c.section as class_section,
                       u.department, u.entry_year
                FROM users u
                LEFT JOIN classes c ON u.class_id = c.id
                WHERE u.role = 'student'
                ORDER BY u.full_name
            `);

            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=students_${new Date().toISOString().split('T')[0]}.pdf`);
            doc.pipe(res);

            doc.fontSize(20).font('Helvetica-Bold').text('Students Report', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text(`Total Students: ${result.rows.length} | Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(0.8);

            const tableTop = doc.y;
            const colWidths = [30, 100, 170, 200, 140, 80, 110];
            const headers = ['#', 'Username', 'Full Name', 'Email', 'Class', 'Section', 'Department'];
            const startX = 40;

            doc.fontSize(8).font('Helvetica-Bold');
            let x = startX;
            headers.forEach((h, i) => {
                doc.fillColor('#4F46E5');
                doc.rect(x, tableTop, colWidths[i], 18).fill();
                doc.fillColor('#FFFFFF').text(h, x + 4, tableTop + 4, { width: colWidths[i] - 8 });
                x += colWidths[i];
            });

            doc.font('Helvetica').fontSize(7);
            result.rows.forEach((row, i) => {
                const y = tableTop + 18 + (i * 14);
                if (y > 530) {
                    doc.addPage();
                    return;
                }
                const bgColor = i % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
                x = startX;
                colWidths.forEach((w) => {
                    doc.fillColor(bgColor).rect(x, y, w, 14).fill();
                    x += w;
                });

                const rowData = [
                    String(i + 1),
                    row.username || '',
                    row.full_name || '',
                    row.email || '',
                    row.class_name || '',
                    row.class_section || '',
                    row.department || ''
                ];

                x = startX;
                doc.fillColor('#000000');
                rowData.forEach((cell, ci) => {
                    doc.text(cell, x + 4, y + 3, { width: colWidths[ci] - 8, lineBreak: false });
                    x += colWidths[ci];
                });
            });

            doc.end();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async exportReportPDF(req, res) {
        try {
            const [studentsRes, teachersRes, classesRes, statsRes] = await Promise.all([
                pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = true`),
                pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND is_active = true`),
                pool.query(`SELECT COUNT(*) as count FROM classes`),
                pool.query(`
                    SELECT 
                        COUNT(*) FILTER (WHERE status = 'present') as present_count,
                        COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
                        COUNT(*) FILTER (WHERE status = 'late') as late_count,
                        COUNT(*) as total_count
                    FROM attendance
                `)
            ]);

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=system_report_${new Date().toISOString().split('T')[0]}.pdf`);
            doc.pipe(res);

            doc.fontSize(24).font('Helvetica-Bold').text('Digital Attendance System', { align: 'center' });
            doc.fontSize(16).text('Full System Report', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').fillColor('#666666')
                .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(1);

            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('System Overview');
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica');

            const stats = [
                `Total Students: ${studentsRes.rows[0].count}`,
                `Total Teachers: ${teachersRes.rows[0].count}`,
                `Total Classes: ${classesRes.rows[0].count}`
            ];
            stats.forEach(s => doc.text(`  - ${s}`));
            doc.moveDown(0.5);

            const attStats = statsRes.rows[0];
            const totalAtt = parseInt(attStats.total_count) || 0;
            const rate = totalAtt > 0 ? ((parseInt(attStats.present_count) + parseInt(attStats.late_count)) / totalAtt * 100).toFixed(1) : 'N/A';

            doc.fontSize(14).text('Attendance Summary');
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica');
            doc.text(`  - Total Attendance Records: ${totalAtt}`);
            doc.text(`  - Present: ${attStats.present_count}`);
            doc.text(`  - Absent: ${attStats.absent_count}`);
            doc.text(`  - Late: ${attStats.late_count}`);
            doc.text(`  - Overall Attendance Rate: ${rate}%`);

            doc.moveDown(1);
            const classDetails = await pool.query(`
                SELECT c.name, c.section, 
                    (SELECT COUNT(DISTINCT u.id) FROM users u 
                     JOIN classes sc ON u.class_id = sc.id 
                     WHERE sc.section = c.section AND u.role = 'student' AND u.is_active = true) as student_count
                FROM classes c ORDER BY c.name, c.section
            `);

            doc.fontSize(14).font('Helvetica-Bold').text('Class Details');
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica');

            classDetails.rows.forEach(c => {
                doc.text(`  - ${c.name} (Section ${c.section}): ${c.student_count} students`);
            });

            doc.moveDown(1);
            doc.fontSize(8).fillColor('#999999').text('Digital Attendance System v1.0', { align: 'center' });

            doc.end();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = exportController;

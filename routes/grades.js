const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Grade = require('../models/Grade');
const router = express.Router();

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// GET grades for a student (by studentName query param or own grades)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { studentName, semester, className } = req.query;
        const query = {};
        if (studentName) query.studentName = studentName;
        if (semester) query.semester = semester;
        if (className) query.className = className;

        const grades = await Grade.find(query).sort({ semester: 1, subject: 1 });
        res.json({ success: true, grades });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET grades summary by semester for a student
router.get('/summary/:studentName', verifyToken, async (req, res) => {
    try {
        const grades = await Grade.find({ studentName: req.params.studentName })
            .sort({ semester: 1, subject: 1 });

        // Group by semester
        const semesters = {};
        grades.forEach(g => {
            if (!semesters[g.semester]) semesters[g.semester] = { grades: [], totalCredits: 0, earnedPoints: 0 };
            semesters[g.semester].grades.push(g);
            const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0, 'AB': 0 };
            semesters[g.semester].totalCredits += g.credits;
            semesters[g.semester].earnedPoints += (gradePoints[g.grade] || 0) * g.credits;
        });

        // Calculate GPA per semester
        const summary = Object.entries(semesters).map(([sem, data]) => ({
            semester: sem,
            grades: data.grades,
            gpa: data.totalCredits > 0 ? (data.earnedPoints / data.totalCredits).toFixed(2) : '0.00',
            totalCredits: data.totalCredits
        }));

        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST enter grade (teacher/admin)
router.post('/', verifyToken, [
    body('studentName').isLength({ min: 1 }).trim(),
    body('subject').isLength({ min: 1 }).trim(),
    body('semester').isLength({ min: 1 }).trim(),
    body('marks.total').isNumeric()
], async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.userRole)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        // Check if grade already exists for this student+subject+semester
        const existing = await Grade.findOne({
            studentName: req.body.studentName,
            subject: req.body.subject,
            semester: req.body.semester
        });

        if (existing) {
            existing.marks = req.body.marks || existing.marks;
            existing.credits = req.body.credits || existing.credits;
            existing.remarks = req.body.remarks || existing.remarks;
            await existing.save();
            return res.json({ success: true, grade: existing, message: 'Updated' });
        }

        const grade = new Grade({
            ...req.body,
            teacher: req.userId,
            teacherName: req.body.teacherName || 'Teacher'
        });
        await grade.save();
        res.status(201).json({ success: true, grade });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE grade
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.userRole)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await Grade.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

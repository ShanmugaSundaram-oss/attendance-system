const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const moment = require('moment-timezone');

const router = express.Router();

// Verify admin token
const verifyAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const { role, isActive } = req.query;
        const query = {};
        
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get dashboard statistics
router.get('/dashboard-stats', verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await Student.countDocuments();
        const totalTeachers = await Teacher.countDocuments();
        const totalClasses = await Class.countDocuments();
        const totalAttendance = await Attendance.countDocuments();

        const today = moment().startOf('day').toDate();
        const todayAttendance = await Attendance.find({
            date: { $gte: today }
        }).countDocuments();

        const presentToday = await Attendance.find({
            date: { $gte: today },
            status: 'present'
        }).countDocuments();

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalClasses,
                totalAttendance,
                todayAttendance,
                presentToday
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create class
router.post('/classes', verifyAdmin, [
    body('className').notEmpty().trim(),
    body('classCode').notEmpty().trim().toUpperCase(),
    body('teacherId').notEmpty(),
    body('semester').isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { className, classCode, teacherId, semester, department, academicYear } = req.body;

        const existingClass = await Class.findOne({ classCode });
        if (existingClass) {
            return res.status(400).json({ success: false, message: 'Class code already exists' });
        }

        const newClass = new Class({
            className,
            classCode,
            teacher: teacherId,
            semester,
            department,
            academicYear
        });

        await newClass.save();
        await newClass.populate('teacher', 'firstName lastName');

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            class: newClass
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all classes
router.get('/classes', verifyAdmin, async (req, res) => {
    try {
        const { isActive, academicYear } = req.query;
        const query = {};
        
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (academicYear) query.academicYear = academicYear;

        const classes = await Class.find(query)
            .populate('teacher', 'firstName lastName')
            .populate('students', 'rollNumber')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: classes.length, classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add student to class
router.post('/classes/:classId/add-student', verifyAdmin, [
    body('studentId').notEmpty()
], async (req, res) => {
    try {
        const { classId } = req.params;
        const { studentId } = req.body;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        if (!classDoc.students.includes(studentId)) {
            classDoc.students.push(studentId);
            await classDoc.save();
        }

        const student = await Student.findById(studentId);
        if (student && !student.classes.includes(classId)) {
            student.classes.push(classId);
            await student.save();
        }

        res.json({ success: true, message: 'Student added to class' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Generate attendance report
router.get('/reports/attendance', verifyAdmin, async (req, res) => {
    try {
        const { fromDate, toDate, classId, status } = req.query;
        const query = {};

        if (fromDate && toDate) {
            query.date = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        if (classId) query.classId = classId;
        if (status) query.status = status;

        const records = await Attendance.find(query)
            .populate('studentId', 'rollNumber userId')
            .populate('classId', 'className')
            .sort({ date: -1 });

        const summary = {
            total: records.length,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            late: records.filter(r => r.status === 'late').length,
            leave: records.filter(r => r.status === 'leave').length,
            excused: records.filter(r => r.status === 'excused').length
        };

        res.json({
            success: true,
            summary,
            records
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Deactivate user
router.put('/users/:userId/deactivate', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get student list with attendance summary
router.get('/students/summary', verifyAdmin, async (req, res) => {
    try {
        const students = await Student.find()
            .populate('userId', 'username email firstName lastName')
            .select('studentId rollNumber totalClasses attendedClasses attendancePercentage');

        const summary = students.map(s => ({
            studentId: s.studentId,
            rollNumber: s.rollNumber,
            name: `${s.userId?.firstName} ${s.userId?.lastName}`,
            email: s.userId?.email,
            totalClasses: s.totalClasses,
            attendedClasses: s.attendedClasses,
            attendancePercentage: s.attendancePercentage
        }));

        res.json({ success: true, count: summary.length, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

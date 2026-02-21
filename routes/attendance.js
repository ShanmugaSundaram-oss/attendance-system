const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const User = require('../models/User');
const moment = require('moment-timezone');

const router = express.Router();

// Auth middleware
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Save face descriptor
router.post('/save-face', verifyToken, [
    body('descriptor').isArray(),
    body('confidence').isFloat({ min: 0, max: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { descriptor, confidence } = req.body;
        
        const student = await Student.findOne({ userId: req.userId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        student.faceDescriptors.push({
            descriptor,
            capturedAt: new Date(),
            confidence
        });
        student.isFaceRegistered = true;
        student.faceRegisteredAt = new Date();
        
        await student.save();

        res.json({ success: true, message: 'Face registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark attendance
router.post('/mark-attendance', verifyToken, [
    body('studentId').notEmpty(),
    body('classId').notEmpty(),
    body('status').isIn(['present', 'absent', 'late', 'leave', 'excused']),
    body('faceMatchConfidence').isFloat({ min: 0, max: 1 }).optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { studentId, classId, status, faceMatchConfidence, location, remarks } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const today = moment().startOf('day').toDate();
        
        // Check if already marked today
        let attendance = await Attendance.findOne({
            studentId,
            classId,
            date: { $gte: today }
        });

        if (!attendance) {
            attendance = new Attendance({
                studentId,
                classId,
                date: new Date(),
                timeIn: new Date(),
                status,
                faceMatchConfidence: faceMatchConfidence || 0,
                location,
                remarks,
                markedBy: req.userId,
                isAutomated: req.userRole === 'student'
            });
        } else {
            attendance.timeOut = new Date();
            attendance.status = status;
            attendance.updatedAt = new Date();
        }

        await attendance.save();

        // Update student stats
        student.totalClasses += 1;
        if (status === 'present') student.attendedClasses += 1;
        else if (status === 'late') student.lateClasses += 1;
        else if (status === 'absent') student.absentClasses += 1;
        
        student.attendancePercentage = student.calculateAttendancePercentage();
        student.lastAttendanceAt = new Date();
        await student.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get attendance records
router.get('/records', verifyToken, async (req, res) => {
    try {
        let query = {};

        if (req.userRole === 'student') {
            const student = await Student.findOne({ userId: req.userId });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }
            query.studentId = student._id;
        }

        const { classId, fromDate, toDate, status } = req.query;

        if (classId) query.classId = classId;
        if (status) query.status = status;
        
        if (fromDate && toDate) {
            query.date = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        const records = await Attendance.find(query)
            .populate('studentId', 'rollNumber userId')
            .populate('classId', 'className classCode')
            .sort({ date: -1 })
            .limit(100);

        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get attendance statistics
router.get('/stats/:classId', verifyToken, async (req, res) => {
    try {
        const { classId } = req.params;
        const { fromDate, toDate } = req.query;

        const query = { classId };

        if (fromDate && toDate) {
            query.date = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        const records = await Attendance.find(query).populate('studentId');

        const studentStats = {};
        records.forEach(record => {
            const studentId = record.studentId._id.toString();
            if (!studentStats[studentId]) {
                studentStats[studentId] = {
                    student: record.studentId,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    leave: 0,
                    excused: 0
                };
            }
            studentStats[studentId].total += 1;
            studentStats[studentId][record.status] += 1;
        });

        Object.keys(studentStats).forEach(key => {
            const stat = studentStats[key];
            stat.percentage = stat.total ? Math.round(((stat.present + stat.late) / stat.total) * 100) : 0;
        });

        res.json({
            success: true,
            stats: Object.values(studentStats),
            summary: {
                totalRecords: records.length,
                present: records.filter(r => r.status === 'present').length,
                absent: records.filter(r => r.status === 'absent').length,
                late: records.filter(r => r.status === 'late').length,
                leave: records.filter(r => r.status === 'leave').length,
                excused: records.filter(r => r.status === 'excused').length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get today's summary
router.get('/today-summary', verifyToken, async (req, res) => {
    try {
        const today = moment().startOf('day').toDate();
        const tomorrow = moment(today).add(1, 'day').toDate();

        const records = await Attendance.find({
            date: { $gte: today, $lt: tomorrow }
        })
            .populate('studentId', 'rollNumber userId')
            .populate('classId', 'className')
            .sort({ timeIn: -1 });

        const summary = {
            totalPresent: records.filter(r => r.status === 'present').length,
            totalLate: records.filter(r => r.status === 'late').length,
            totalAbsent: records.filter(r => r.status === 'absent').length,
            totalLeave: records.filter(r => r.status === 'leave').length,
            totalExcused: records.filter(r => r.status === 'excused').length,
            records
        };

        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get student stats
router.get('/student-stats/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { fromDate, toDate } = req.query;

        const query = { studentId };

        if (fromDate && toDate) {
            query.date = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        const records = await Attendance.find(query);

        const stats = {
            totalClasses: records.length,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            late: records.filter(r => r.status === 'late').length,
            leave: records.filter(r => r.status === 'leave').length,
            excused: records.filter(r => r.status === 'excused').length,
            percentage: records.length ? Math.round(((records.filter(r => r.status === 'present').length) / records.length) * 100) : 0
        };

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bulk mark attendance
router.post('/bulk-mark', verifyToken, [
    body('records').isArray()
], async (req, res) => {
    try {
        const { records } = req.body;

        const savedRecords = await Attendance.insertMany(
            records.map(r => ({
                ...r,
                markedBy: req.userId,
                isAutomated: false
            }))
        );

        res.json({
            success: true,
            message: `${savedRecords.length} records saved`,
            count: savedRecords.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export attendance report (CSV format)
router.get('/export/:classId', verifyToken, async (req, res) => {
    try {
        const { classId } = req.params;
        const { fromDate, toDate } = req.query;

        const query = { classId };

        if (fromDate && toDate) {
            query.date = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        const records = await Attendance.find(query)
            .populate('studentId', 'rollNumber userId')
            .populate('classId', 'className');

        const csv = records.map(r => ({
            date: moment(r.date).format('YYYY-MM-DD'),
            time: moment(r.timeIn).format('HH:mm:ss'),
            student: r.studentId?.userId?.username,
            rollNumber: r.studentId?.rollNumber,
            status: r.status,
            confidence: r.faceMatchConfidence
        }));

        res.json({ success: true, data: csv });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
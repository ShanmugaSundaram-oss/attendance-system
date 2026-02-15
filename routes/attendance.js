const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Save face descriptor for student
router.post('/save-face', auth, authorize('student'), async (req, res) => {
    try {
        const { descriptor } = req.body;
        
        const student = await Student.findOne({ userId: req.userId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        student.faceDescriptor = descriptor;
        student.faceRegisteredAt = new Date();
        await student.save();

        res.json({ success: true, message: 'Face registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark attendance (teacher marks for student or student marks for themselves)
router.post('/mark-attendance', auth, async (req, res) => {
    try {
        const { studentId, faceMatchConfidence, status = 'present' } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if already marked today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
            studentId: studentId,
            date: { $gte: today }
        });

        if (existingAttendance) {
            return res.status(400).json({ success: false, message: 'Already marked for today' });
        }

        const attendance = new Attendance({
            studentId: studentId,
            date: new Date(),
            status: status,
            markedBy: req.userId,
            faceMatchConfidence: faceMatchConfidence || 0
        });

        await attendance.save();

        // Update student attendance stats
        student.totalClasses += 1;
        if (status === 'present' || status === 'late') {
            student.attendedClasses += 1;
        }
        student.attendancePercentage = student.calculateAttendancePercentage();
        student.lastAttendanceAt = new Date();
        await student.save();

        res.json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get attendance records (for student - their own, for teacher - all students)
router.get('/records', auth, async (req, res) => {
    try {
        let query = {};

        if (req.userType === 'student') {
            const student = await Student.findOne({ userId: req.userId });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }
            query.studentId = student._id;
        }

        const records = await Attendance.find(query)
            .populate('studentId', 'userId')
            .populate('markedBy', 'username')
            .sort({ date: -1 })
            .limit(100);

        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get student's attendance statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.userId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const stats = {
            totalClasses: student.totalClasses,
            attendedClasses: student.attendedClasses,
            attendancePercentage: student.attendancePercentage,
            lastAttendanceAt: student.lastAttendanceAt,
            faceRegistered: !!student.faceDescriptor
        };

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get today's attendance summary (for teacher)
router.get('/today-summary', auth, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const records = await Attendance.find({
            date: { $gte: today, $lt: tomorrow }
        })
            .populate('studentId', 'userId studentId')
            .sort({ date: -1 });

        const summary = {
            totalPresent: records.filter(r => r.status === 'present').length,
            totalLate: records.filter(r => r.status === 'late').length,
            totalAbsent: records.filter(r => r.status === 'absent').length,
            totalLeave: records.filter(r => r.status === 'leave').length,
            records
        };

        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
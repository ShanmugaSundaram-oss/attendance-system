const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const FACES_COLLECTION = 'faces';
const ATTENDANCE_COLLECTION = 'attendance';

// Middleware to verify JWT
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        next();
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

// ─── STUDENT: Register face (one-time) ───
router.post('/register', verifyToken, async (req, res) => {
    try {
        const { descriptor, studentName, studentEmail, studentId } = req.body;

        if (!descriptor || !studentEmail) {
            return res.status(400).json({ success: false, message: 'Face descriptor and email are required' });
        }

        // Check if student already registered a face
        const existing = await db.collection(FACES_COLLECTION)
            .where('studentEmail', '==', studentEmail.toLowerCase())
            .get();

        if (!existing.empty) {
            return res.status(400).json({
                success: false,
                message: 'Face already registered. You can only register your face once.'
            });
        }

        // Look up department from users collection
        let department = '';
        try {
            const userSnap = await db.collection('users')
                .where('email', '==', studentEmail.toLowerCase())
                .get();
            if (!userSnap.empty) {
                department = userSnap.docs[0].data().department || '';
            }
        } catch (e) { }

        // Save face descriptor to Firestore
        const faceData = {
            studentName: studentName || '',
            studentEmail: studentEmail.toLowerCase(),
            studentId: studentId || '',
            department,
            descriptor: JSON.stringify(descriptor), // Float32Array → JSON string
            registeredBy: req.user.userId,
            registeredAt: new Date().toISOString()
        };

        const docRef = await db.collection(FACES_COLLECTION).add(faceData);

        res.status(201).json({
            success: true,
            message: 'Face registered successfully',
            faceId: docRef.id
        });
    } catch (error) {
        console.error('Face registration error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── Check if student face is already registered ───
router.get('/check/:email', verifyToken, async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();
        const existing = await db.collection(FACES_COLLECTION)
            .where('studentEmail', '==', email)
            .get();

        res.json({
            success: true,
            registered: !existing.empty
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── TEACHER: Get all registered faces (for scanning) ───
router.get('/all', verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection(FACES_COLLECTION).get();
        const faces = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            faces.push({
                id: doc.id,
                studentName: data.studentName,
                studentEmail: data.studentEmail,
                studentId: data.studentId,
                department: data.department || '',
                descriptor: JSON.parse(data.descriptor)
            });
        });

        res.json({ success: true, faces });
    } catch (error) {
        console.error('Error fetching faces:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── TEACHER: Mark attendance ───
router.post('/attendance', verifyToken, async (req, res) => {
    try {
        const { studentEmail, studentName, date, time, subject, markedBy } = req.body;

        if (!studentEmail || !date) {
            return res.status(400).json({ success: false, message: 'Student email and date required' });
        }

        // Check if attendance already marked for this student today
        const existing = await db.collection(ATTENDANCE_COLLECTION)
            .where('studentEmail', '==', studentEmail.toLowerCase())
            .where('date', '==', date)
            .get();

        if (!existing.empty) {
            return res.json({
                success: true,
                message: 'Attendance already marked for today',
                alreadyMarked: true
            });
        }

        const attendanceData = {
            studentEmail: studentEmail.toLowerCase(),
            studentName: studentName || '',
            date,
            time: time || new Date().toLocaleTimeString(),
            subject: subject || 'General',
            markedBy: markedBy || req.user.userId,
            status: 'present',
            createdAt: new Date().toISOString()
        };

        await db.collection(ATTENDANCE_COLLECTION).add(attendanceData);

        res.status(201).json({
            success: true,
            message: `Attendance marked for ${studentName || studentEmail}`
        });
    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── Get attendance for a date ───
router.get('/attendance/:date', verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection(ATTENDANCE_COLLECTION)
            .where('date', '==', req.params.date)
            .get();

        const records = [];
        snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));

        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── Get attendance for a specific student ───
router.get('/attendance/student/:email', verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection(ATTENDANCE_COLLECTION)
            .where('studentEmail', '==', req.params.email.toLowerCase())
            .get();

        const records = [];
        snapshot.forEach(doc => records.push({ id: doc.id, ...doc.data() }));

        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

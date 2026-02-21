const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Timetable = require('../models/Timetable');
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

// GET all timetables
router.get('/', verifyToken, async (req, res) => {
    try {
        const timetables = await Timetable.find({ isActive: true }).sort({ className: 1 });
        res.json({ success: true, timetables });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET timetable by class name
router.get('/class/:className', verifyToken, async (req, res) => {
    try {
        const timetable = await Timetable.findOne({
            className: req.params.className,
            isActive: true
        });
        if (!timetable) return res.status(404).json({ success: false, message: 'No timetable found' });
        res.json({ success: true, timetable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create or update timetable (teacher/admin)
router.post('/', verifyToken, [
    body('className').isLength({ min: 1 }).trim()
], async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.userRole)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const existing = await Timetable.findOne({ className: req.body.className });
        if (existing) {
            existing.schedule = req.body.schedule || existing.schedule;
            existing.department = req.body.department || existing.department;
            existing.semester = req.body.semester || existing.semester;
            await existing.save();
            return res.json({ success: true, timetable: existing, message: 'Updated' });
        }

        const timetable = new Timetable({
            ...req.body,
            createdBy: req.userId
        });
        await timetable.save();
        res.status(201).json({ success: true, timetable });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE timetable
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.userRole)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

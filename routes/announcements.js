const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Announcement = require('../models/Announcement');
const router = express.Router();

// Verify token
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

// GET all announcements (any authenticated user)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { category, limit = 20 } = req.query;
        const query = { isActive: true };
        if (category) query.category = category;

        const announcements = await Announcement.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create announcement (teacher/admin only)
router.post('/', verifyToken, [
    body('title').isLength({ min: 1, max: 200 }).trim(),
    body('content').isLength({ min: 1, max: 5000 }).trim(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('category').optional().isIn(['general', 'academic', 'exam', 'event', 'holiday'])
], async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.userRole)) {
            return res.status(403).json({ success: false, message: 'Only teachers and admins can post' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const announcement = new Announcement({
            ...req.body,
            author: req.userId,
            authorName: req.body.authorName || 'Staff',
            authorRole: req.userRole
        });

        await announcement.save();
        res.status(201).json({ success: true, announcement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE announcement (author or admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });

        if (announcement.author.toString() !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

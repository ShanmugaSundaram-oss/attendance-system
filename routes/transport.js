const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const BusRoute = require('../models/BusRoute');
const BusNotice = require('../models/BusNotice');
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

// ─── BUS ROUTES ────────────────────────────────────────

// GET all bus routes (any authenticated user or public)
router.get('/routes', async (req, res) => {
    try {
        const routes = await BusRoute.find({ isActive: true }).sort({ number: 1 });
        res.json({ success: true, routes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create bus route (transport only)
router.post('/routes', verifyToken, [
    body('number').isLength({ min: 1 }).trim(),
    body('name').isLength({ min: 1 }).trim(),
    body('timing').isLength({ min: 1 }).trim()
], async (req, res) => {
    try {
        if (req.userRole !== 'transport' && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only transport incharge can manage routes' });
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const route = new BusRoute({
            ...req.body,
            stops: typeof req.body.stops === 'string' ? req.body.stops.split(',').map(s => s.trim()) : req.body.stops,
            createdBy: req.userId
        });
        await route.save();
        res.status(201).json({ success: true, route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update bus route
router.put('/routes/:id', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'transport' && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const update = { ...req.body };
        if (typeof update.stops === 'string') {
            update.stops = update.stops.split(',').map(s => s.trim());
        }
        const route = await BusRoute.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE bus route
router.delete('/routes/:id', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'transport' && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await BusRoute.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─── BUS NOTICES ───────────────────────────────────────

// GET all bus notices (public)
router.get('/notices', async (req, res) => {
    try {
        const notices = await BusNotice.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, notices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create bus notice (transport only)
router.post('/notices', verifyToken, [
    body('title').isLength({ min: 1 }).trim(),
    body('content').isLength({ min: 1 }).trim()
], async (req, res) => {
    try {
        if (req.userRole !== 'transport' && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only transport incharge can send notices' });
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const notice = new BusNotice({
            ...req.body,
            createdBy: req.userId
        });
        await notice.save();
        res.status(201).json({ success: true, notice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE bus notice
router.delete('/notices/:id', verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'transport' && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await BusNotice.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Notice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

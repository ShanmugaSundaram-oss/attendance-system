const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const router = express.Router();

// Validation middleware
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Register endpoint
router.post('/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student', 'teacher']),
    body('firstName').trim().escape(),
    body('lastName').trim().escape()
], validateInput, async (req, res) => {
    try {
        const { username, email, password, role, firstName, lastName } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            role,
            firstName,
            lastName
        });

        await user.save();

        // Create profile based on role
        if (role === 'student') {
            const student = new Student({
                userId: user._id,
                studentId: `STU-${user._id}`
            });
            await student.save();
        } else if (role === 'teacher') {
            const teacher = new Teacher({
                userId: user._id,
                employeeId: `EMP-${user._id}`
            });
            await teacher.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login endpoint
router.post('/login', [
    body('username').notEmpty().trim(),
    body('password').notEmpty()
], validateInput, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(403).json({ success: false, message: 'Account locked. Try again later.' });
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
            }
            await user.save();
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Reset login attempts on successful login
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: user.toJSON() });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Verify token
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        res.json({ success: true, valid: true, decoded });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Change password
router.post('/change-password', [
    body('oldPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], validateInput, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { oldPassword, newPassword } = req.body;
        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Old password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Logout (optional - for client-side token management)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

const USERS_COLLECTION = 'users';
const ALLOWED_DOMAIN = 'ritchennai.edu.in';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role, firstName, lastName, phone, department, studentClass } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Username, email, password, and role are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be student or teacher' });
        }

        // Check email domain
        const emailDomain = email.split('@')[1] || '';
        if (!emailDomain.endsWith(ALLOWED_DOMAIN)) {
            return res.status(400).json({ success: false, message: 'Only @ritchennai.edu.in emails are allowed' });
        }

        // Check if user already exists (by email)
        const existingUser = await db.collection(USERS_COLLECTION).where('email', '==', email.toLowerCase()).get();
        if (!existingUser.empty) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Check by username too
        const existingUsername = await db.collection(USERS_COLLECTION).where('username', '==', username).get();
        if (!existingUsername.empty) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user doc in Firestore
        const userData = {
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || '',
            department: department || '',
            studentClass: studentClass || '',
            authProvider: 'local',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        const docRef = await db.collection(USERS_COLLECTION).add(userData);

        // Generate JWT token
        const token = jwt.sign(
            { userId: docRef.id, role: userData.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: docRef.id,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                firstName: userData.firstName,
                lastName: userData.lastName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // Find user by username OR email
        let userDoc = null;
        let userId = null;

        // Try username first
        const byUsername = await db.collection(USERS_COLLECTION).where('username', '==', username).get();
        if (!byUsername.empty) {
            userDoc = byUsername.docs[0];
            userId = userDoc.id;
        } else {
            // Try email
            const byEmail = await db.collection(USERS_COLLECTION).where('email', '==', username.toLowerCase()).get();
            if (!byEmail.empty) {
                userDoc = byEmail.docs[0];
                userId = userDoc.id;
            }
        }

        if (!userDoc) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const userData = userDoc.data();

        // Check if account is active
        if (userData.isActive === false) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last login
        await db.collection(USERS_COLLECTION).doc(userId).update({
            lastLogin: new Date().toISOString()
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: userId, role: userData.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: userId,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                department: userData.department || '',
                studentClass: userData.studentClass || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ success: false, message: 'No token' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userDoc = await db.collection(USERS_COLLECTION).doc(decoded.userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userData = userDoc.data();
        delete userData.password;
        res.json({ success: true, user: { id: userDoc.id, ...userData } });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;
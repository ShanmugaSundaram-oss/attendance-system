const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Allowed email domain
const ALLOWED_DOMAIN = 'ritchennai.edu.in';

// Firebase Auth — receives verified user info from client-side Firebase SDK
router.post('/firebase', async (req, res) => {
    try {
        const { email, displayName, photoURL, uid, userType } = req.body;

        if (!email || !uid) {
            return res.status(400).json({ success: false, message: 'Email and UID are required' });
        }

        // Check domain — allow any subdomain of ritchennai.edu.in
        const emailDomain = email.split('@')[1];
        if (!emailDomain || !emailDomain.endsWith(ALLOWED_DOMAIN)) {
            return res.status(403).json({
                success: false,
                message: `Access restricted to @${ALLOWED_DOMAIN} email addresses. Your email (${email}) is not permitted.`
            });
        }

        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            const username = email.split('@')[0];
            const role = userType || 'student';
            const nameParts = (displayName || '').split(' ');

            user = new User({
                username: username,
                email: email.toLowerCase(),
                password: `firebase_${uid}_${Date.now()}`,
                role: role,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                profilePicture: photoURL || '',
                isActive: true,
                authProvider: 'google',
                googleId: uid
            });

            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // Generate our app's JWT
        const token = jwt.sign(
            { userId: user._id, userType: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.firstName || (displayName || '').split(' ')[0],
                lastName: user.lastName || '',
                profilePicture: photoURL
            }
        });

    } catch (error) {
        console.error('Firebase auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed. Please try again.'
        });
    }
});

module.exports = router;

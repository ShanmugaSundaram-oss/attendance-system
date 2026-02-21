const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize Firebase Admin SDK (uses projectId from env)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'rit-smart-ims'
    });
}

// Allowed email domain
const ALLOWED_DOMAIN = 'ritchennai.edu.in';

router.post('/firebase', async (req, res) => {
    try {
        const { idToken, userType } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
        }

        // Verify Firebase ID token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (verifyError) {
            console.error('Firebase token verification failed:', verifyError.message);
            return res.status(401).json({ success: false, message: 'Invalid or expired token. Please sign in again.' });
        }

        const { email, name, picture, uid } = decodedToken;

        if (!email) {
            return res.status(400).json({ success: false, message: 'No email found in Firebase account' });
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
            // Auto-create user on first Firebase login
            const username = email.split('@')[0];
            const role = userType || 'student';
            const nameParts = (name || '').split(' ');

            user = new User({
                username: username,
                email: email.toLowerCase(),
                password: `firebase_${uid}_${Date.now()}`,
                role: role,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                profilePicture: picture || '',
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
                firstName: user.firstName || (name || '').split(' ')[0],
                lastName: user.lastName || '',
                profilePicture: picture
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

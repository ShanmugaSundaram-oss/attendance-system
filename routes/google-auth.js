const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const USERS_COLLECTION = 'users';
const ALLOWED_DOMAIN = 'ritchennai.edu.in';

// Firebase Auth — receives verified user info from client-side Firebase SDK
router.post('/firebase', async (req, res) => {
    try {
        const { email, displayName, photoURL, uid, userType } = req.body;

        if (!email || !uid) {
            return res.status(400).json({ success: false, message: 'Email and UID are required' });
        }

        // Check domain
        const emailDomain = email.split('@')[1];
        if (!emailDomain || !emailDomain.endsWith(ALLOWED_DOMAIN)) {
            return res.status(403).json({
                success: false,
                message: `Access restricted to @${ALLOWED_DOMAIN} emails. Your email (${email}) is not permitted.`
            });
        }

        // Find user by email in Firestore
        const existingUsers = await db.collection(USERS_COLLECTION).where('email', '==', email.toLowerCase()).get();

        let userId, userData;

        if (!existingUsers.empty) {
            // Existing user
            const doc = existingUsers.docs[0];
            userId = doc.id;
            userData = doc.data();

            // Update last login
            await db.collection(USERS_COLLECTION).doc(userId).update({
                lastLogin: new Date().toISOString(),
                googleId: uid,
                profilePicture: photoURL || '',
                authProvider: 'google'
            });
        } else {
            // Create new user
            const nameParts = (displayName || '').split(' ');
            const username = email.split('@')[0];

            userData = {
                username,
                email: email.toLowerCase(),
                password: `firebase_${uid}_${Date.now()}`,
                role: userType || 'student',
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                profilePicture: photoURL || '',
                isActive: true,
                authProvider: 'google',
                googleId: uid,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            const docRef = await db.collection(USERS_COLLECTION).add(userData);
            userId = docRef.id;
        }

        // Generate JWT
        const token = jwt.sign(
            { userId, role: userData.role },
            process.env.JWT_SECRET,
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
                firstName: userData.firstName || (displayName || '').split(' ')[0],
                lastName: userData.lastName || '',
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

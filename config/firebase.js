const admin = require('firebase-admin');

let credential;

try {
    // Try file first (local development)
    const serviceAccount = require('./firebase-service-account.json');
    credential = admin.credential.cert(serviceAccount);
} catch (e) {
    // Fallback to base64-encoded service account (Vercel / production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decoded);
        credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
        // Fallback to individual env vars
        credential = admin.credential.cert({
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID || '',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
        });
    } else {
        console.error('No Firebase credentials found');
        process.exit(1);
    }
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 'smartattendance-e7bba'
    });
}

const db = admin.firestore();

module.exports = { admin, db };

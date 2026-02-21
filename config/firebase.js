const admin = require('firebase-admin');

// Support both file-based and env-var-based credentials
let credential;

try {
    // Try file first (local development)
    const serviceAccount = require('./firebase-service-account.json');
    credential = admin.credential.cert(serviceAccount);
} catch (e) {
    // Fallback to environment variables (Vercel / production)
    if (process.env.FIREBASE_PRIVATE_KEY) {
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
        console.error('❌ No Firebase credentials found. Set env vars or add service account file.');
        process.exit(1);
    }
}

admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'smartattendance-e7bba'
});

const db = admin.firestore();

module.exports = { admin, db };

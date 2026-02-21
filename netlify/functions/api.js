const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase
const { db } = require('../../config/firebase');

// Import routes
const authRoutes = require('../../routes/auth');
const googleAuthRoutes = require('../../routes/google-auth');
const faceRoutes = require('../../routes/face');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/face', faceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Server is running',
        database: 'Firebase Firestore',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Legacy endpoint
app.post('/api/save-face', (req, res) => {
    res.json({ success: true, message: 'Face data received' });
});

// 404 for API routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

module.exports.handler = serverless(app);

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Atlas connected successfully');
        return true;
    } catch (error) {
        console.warn('⚠️  MongoDB connection failed:', error.message);
        console.warn('⚠️  App will run in localStorage-only mode');
        return false;
    }
};

module.exports = connectDB;

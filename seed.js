/**
 * Database Seed Script
 * Creates default users for the Smart Attendance IMS
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const defaultUsers = [
    {
        username: 'student1',
        email: 'student1@rit.edu',
        password: 'student1',
        role: 'student',
        firstName: 'Student',
        lastName: 'One'
    },
    {
        username: 'student2',
        email: 'student2@rit.edu',
        password: 'student2',
        role: 'student',
        firstName: 'Student',
        lastName: 'Two'
    },
    {
        username: 'student3',
        email: 'student3@rit.edu',
        password: 'student3',
        role: 'student',
        firstName: 'Student',
        lastName: 'Three'
    },
    {
        username: 'teacher1',
        email: 'teacher1@rit.edu',
        password: 'teacher1',
        role: 'teacher',
        firstName: 'Teacher',
        lastName: 'One'
    },
    {
        username: 'admin',
        email: 'admin@rit.edu',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'RIT'
    },
    {
        username: 'transport1',
        email: 'transport1@rit.edu',
        password: 'transport1',
        role: 'transport',
        firstName: 'Transport',
        lastName: 'Incharge'
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        for (const userData of defaultUsers) {
            const existing = await User.findOne({ username: userData.username });
            if (existing) {
                console.log(`⏭️  User "${userData.username}" already exists — skipping`);
            } else {
                const user = new User(userData);
                await user.save();
                console.log(`✅ Created user: ${userData.username} (${userData.role})`);
            }
        }

        console.log('\n🎉 Seed completed successfully!');
        console.log('\nDefault accounts:');
        console.log('──────────────────────────────────');
        console.log('Student:   student1 / pass1');
        console.log('Student:   student2 / pass2');
        console.log('Student:   student3 / pass3');
        console.log('Teacher:   teacher1 / pass1');
        console.log('Admin:     admin / admin123');
        console.log('Transport: transport1 / pass1');
        console.log('──────────────────────────────────');

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seed();

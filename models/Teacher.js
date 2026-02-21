const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    department: String,
    qualification: String,
    specialization: String,
    bio: String,
    office: String,
    officeHours: String,
    totalClasses: {
        type: Number,
        default: 0
    },
    classesTaught: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    attendanceRecordsCreated: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on-leave', 'retired'],
        default: 'active'
    },
    joinDate: Date,
    lastActiveAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes
teacherSchema.index({ employeeId: 1, department: 1 });
teacherSchema.index({ status: 1 });
teacherSchema.index({ userId: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
        trim: true
    },
    classCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: String,
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    schedule: {
        days: [String], // Monday, Tuesday, etc.
        startTime: String, // HH:mm
        endTime: String, // HH:mm
        room: String
    },
    department: String,
    semester: Number,
    academicYear: String,
    capacity: Number,
    totalLectures: {
        type: Number,
        default: 0
    },
    attendanceThreshold: {
        type: Number,
        default: 75 // percentage
    },
    isActive: {
        type: Boolean,
        default: true
    },
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
classSchema.index({ classCode: 1, teacher: 1 });
classSchema.index({ isActive: 1, academicYear: 1 });
classSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Class', classSchema);
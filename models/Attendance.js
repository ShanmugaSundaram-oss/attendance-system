const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    date: {
        type: Date,
        required: true
    },
    timeIn: {
        type: Date,
        default: Date.now
    },
    timeOut: Date,
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'leave'],
        default: 'present'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    faceMatchConfidence: {
        type: Number,
        default: 0
    },
    remarks: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ classId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
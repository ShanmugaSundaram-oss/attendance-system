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
        enum: ['present', 'absent', 'late', 'leave', 'excused'],
        default: 'absent'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    faceMatchConfidence: {
        type: Number,
        default: 0
    },
    faceDescriptor: [Number],
    location: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
    },
    isAutomated: {
        type: Boolean,
        default: true
    },
    remarks: String,
    duration: Number, // in minutes
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes for efficient queries
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ studentId: 1, status: 1 });

// Calculate duration
attendanceSchema.pre('save', function(next) {
    if (this.timeOut && this.timeIn) {
        this.duration = Math.round((this.timeOut - this.timeIn) / (1000 * 60));
    }
    next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
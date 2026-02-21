const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    rollNumber: String,
    enrollmentNumber: String,
    department: String,
    semester: Number,
    batch: String,
    parentEmail: String,
    parentPhone: String,
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    faceDescriptors: [{
        descriptor: [Number],
        capturedAt: Date,
        confidence: Number,
        imageUrl: String
    }],
    isFaceRegistered: {
        type: Boolean,
        default: false
    },
    faceRegisteredAt: Date,
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    totalClasses: {
        type: Number,
        default: 0
    },
    attendedClasses: {
        type: Number,
        default: 0
    },
    lateClasses: {
        type: Number,
        default: 0
    },
    absentClasses: {
        type: Number,
        default: 0
    },
    attendancePercentage: {
        type: Number,
        default: 0
    },
    lastAttendanceAt: Date,
    status: {
        type: String,
        enum: ['active', 'inactive', 'graduated'],
        default: 'active'
    },
    attendanceAlerts: {
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
studentSchema.index({ studentId: 1, enrollmentNumber: 1 });
studentSchema.index({ isFaceRegistered: 1 });
studentSchema.index({ userId: 1 });

// Calculate attendance percentage
studentSchema.methods.calculateAttendancePercentage = function() {
    if (this.totalClasses === 0) return 0;
    const actualPresent = this.attendedClasses + this.lateClasses;
    return Math.round((actualPresent / this.totalClasses) * 100);
};

// Update stats
studentSchema.methods.updateStats = function() {
    this.attendancePercentage = this.calculateAttendancePercentage();
    return this.save();
};

module.exports = mongoose.model('Student', studentSchema);
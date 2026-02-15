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
    department: String,
    semester: Number,
    faceDescriptor: {
        type: [Number],
        default: null
    },
    faceRegisteredAt: Date,
    totalClasses: {
        type: Number,
        default: 0
    },
    attendedClasses: {
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate attendance percentage
studentSchema.methods.calculateAttendancePercentage = function() {
    if (this.totalClasses === 0) return 0;
    return Math.round((this.attendedClasses / this.totalClasses) * 100);
};

module.exports = mongoose.model('Student', studentSchema);
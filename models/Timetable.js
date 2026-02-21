const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    startTime: { type: String, required: true },   // "09:00"
    endTime: { type: String, required: true },      // "09:50"
    subject: { type: String, required: true },
    teacher: { type: String, default: '' },
    room: { type: String, default: '' }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    className: {
        type: String,
        required: true
    },
    department: {
        type: String,
        default: ''
    },
    semester: {
        type: String,
        default: ''
    },
    schedule: {
        monday: [periodSchema],
        tuesday: [periodSchema],
        wednesday: [periodSchema],
        thursday: [periodSchema],
        friday: [periodSchema],
        saturday: [periodSchema]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorRole: {
        type: String,
        enum: ['teacher', 'admin'],
        required: true
    },
    targetClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null // null = visible to all
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    category: {
        type: String,
        enum: ['general', 'academic', 'exam', 'event', 'holiday'],
        default: 'general'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ targetClass: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);

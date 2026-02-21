const mongoose = require('mongoose');

const busNoticeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    authorName: { type: String, default: 'Transport Incharge' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

busNoticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BusNotice', busNoticeSchema);

const mongoose = require('mongoose');

const busRouteSchema = new mongoose.Schema({
    number: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    timing: { type: String, required: true, trim: true },
    stops: [{ type: String, trim: true }],
    whatsapp: { type: String, trim: true, default: '' },
    color: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

busRouteSchema.index({ number: 1 });

module.exports = mongoose.model('BusRoute', busRouteSchema);

const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: String,
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    className: {
        type: String,
        default: ''
    },
    marks: {
        internal: { type: Number, default: 0 },
        external: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        maxMarks: { type: Number, default: 100 }
    },
    grade: {
        type: String,
        enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'AB', ''],
        default: ''
    },
    credits: {
        type: Number,
        default: 3
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    teacherName: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

gradeSchema.index({ student: 1, semester: 1 });
gradeSchema.index({ class: 1, subject: 1 });

// Auto‐calculate grade from total marks
gradeSchema.pre('save', function (next) {
    const pct = (this.marks.total / this.marks.maxMarks) * 100;
    if (pct >= 90) this.grade = 'O';
    else if (pct >= 80) this.grade = 'A+';
    else if (pct >= 70) this.grade = 'A';
    else if (pct >= 60) this.grade = 'B+';
    else if (pct >= 50) this.grade = 'B';
    else if (pct >= 40) this.grade = 'C';
    else if (pct >= 33) this.grade = 'D';
    else this.grade = 'F';
    next();
});

module.exports = mongoose.model('Grade', gradeSchema);

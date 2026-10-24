const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  recruitment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruitment',
    required: true
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedRole: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  cgpa: {
    type: Number,
    default: 8.0
  },
  skills: {
    type: String,
    required: true
  },
  priorExperience: {
    type: String,
    default: 'None'
  },
  whyJoin: {
    type: String,
    required: true
  },
  portfolioLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Shortlisted', 'Accepted', 'Rejected'],
    default: 'Submitted'
  },
  interviewDate: {
    type: Date,
    default: null
  },
  interviewVenue: {
    type: String,
    default: ''
  },
  secretaryNotes: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate application by same student for same recruitment drive
ApplicationSchema.index({ recruitment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);

const mongoose = require('mongoose');

const RecruitmentSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  roles: [{
    roleName: { type: String, required: true },
    vacancies: { type: Number, default: 5 },
    description: { type: String },
    requirements: { type: String }
  }],
  eligibility: {
    type: String,
    default: 'Open to 1st, 2nd, and 3rd year BE/B.Tech, MCA, and MSc students'
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Open', 'Closed'],
    default: 'Pending Approval'
  },
  facultyApproval: {
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    remarks: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  instructions: {
    type: String,
    default: 'Fill in your details accurately. Shortlisted candidates will be notified via email and ClubSphere notifications.'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recruitment', RecruitmentSchema);

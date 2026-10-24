const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Social & NSS', 'Sports', 'Literary & Media', 'Entrepreneurship'],
    default: 'Technical'
  },
  tagline: {
    type: String,
    default: 'Innovate, Collaborate, Lead at ClubSphere'
  },
  description: {
    type: String,
    required: true
  },
  objectives: [{
    type: String
  }],
  logo: {
    type: String,
    default: '/images/club-default.png'
  },
  banner: {
    type: String,
    default: '/images/banner-default.jpg'
  },
  facultyAdvisor: {
    name: { type: String, default: 'Dr. Faculty Advisor' },
    designation: { type: String, default: 'Associate Professor' },
    department: { type: String, default: 'ClubSphere' },
    email: { type: String, default: 'faculty@college.ac.in' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  secretary: {
    name: { type: String, default: 'Club Secretary' },
    rollNo: { type: String, default: '' },
    email: { type: String, default: 'secretary@college.ac.in' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  coreTeam: [{
    name: { type: String, required: true },
    designation: { type: String, default: 'Core Member' },
    rollNo: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }],
  recruitmentStatus: {
    type: String,
    enum: ['Open', 'Closed', 'Coming Soon'],
    default: 'Closed'
  },
  contactEmail: {
    type: String,
    default: 'club@college.ac.in'
  },
  instagram: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  foundedYear: {
    type: Number,
    default: 2010
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Club', ClubSchema);

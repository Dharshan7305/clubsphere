const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['Workshop', 'Hackathon', 'Guest Lecture', 'Symposium', 'Competition', 'Cultural Fest', 'Sports Meet'],
    default: 'Workshop'
  },
  description: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true,
    default: 'Campus'
  },
  eventDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    default: '09:30 AM'
  },
  endTime: {
    type: String,
    default: '04:30 PM'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  banner: {
    type: String,
    default: '/images/event-default.jpg'
  },
  maxParticipants: {
    type: Number,
    default: 100
  },
  participants: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String },
    phone: { type: String },
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);

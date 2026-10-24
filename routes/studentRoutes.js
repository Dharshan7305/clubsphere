const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Application = require('../models/Application');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// All student routes require 'student' role (or allow general logged-in student)
router.use(ensureAuthenticated);

// GET /student/dashboard - Student Dashboard Module
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.session.user._id;

    // Applications submitted by this student
    const applications = await Application.find({ student: studentId })
      .populate('club', 'name code category logo')
      .populate('recruitment', 'title deadline status')
      .sort({ submittedAt: -1 });

    // Events registered by this student
    const registeredEvents = await Event.find({
      'participants.student': studentId
    }).populate('club', 'name code logo').sort({ eventDate: 1 });

    // Saved clubs
    const user = await User.findById(studentId).populate('savedClubs');
    const savedClubs = user ? user.savedClubs : [];

    // Joined clubs (where application status is 'Accepted')
    const acceptedApplications = applications.filter(app => app.status === 'Accepted');
    const joinedClubIds = [...new Set(acceptedApplications.map(app => app.club._id.toString()))];
    const joinedClubs = await Club.find({ _id: { $in: joinedClubIds } });

    // Active recruitments across campus
    const activeRecruitments = await Recruitment.find({ status: 'Open' })
      .populate('club', 'name code category logo')
      .sort({ deadline: 1 })
      .limit(5);

    // Recent notifications for this student
    const notifications = await Notification.find({
      $or: [{ recipient: studentId }, { recipient: null }]
    }).sort({ createdAt: -1 }).limit(6);

    res.render('student/dashboard', {
      title: 'Student Dashboard - ClubSphere',
      applications,
      registeredEvents,
      savedClubs,
      joinedClubs,
      activeRecruitments,
      notifications,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Student Dashboard Error:', error);
    req.flash('error_msg', 'Could not load student dashboard.');
    res.redirect('/');
  }
});

// GET /student/recruitments/:id/apply - Recruitment Application Form
router.get('/recruitments/:id/apply', async (req, res) => {
  try {
    const recruitment = await Recruitment.findById(req.params.id).populate('club');
    if (!recruitment || recruitment.status !== 'Open') {
      req.flash('error_msg', 'This recruitment drive is not currently accepting applications.');
      return res.redirect('/clubs');
    }

    // Check if already applied
    const existingApp = await Application.findOne({
      recruitment: recruitment._id,
      student: req.session.user._id
    });

    if (existingApp) {
      req.flash('error_msg', 'You have already applied for this recruitment drive.');
      return res.redirect('/student/applications');
    }

    const user = await User.findById(req.session.user._id);

    res.render('student/apply', {
      title: `Apply: ${recruitment.title} - ${recruitment.club.name}`,
      recruitment,
      user,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Recruitment Apply Page Error:', error);
    req.flash('error_msg', 'Error loading application form.');
    res.redirect('/clubs');
  }
});

// POST /student/recruitments/:id/apply - Submit Application
router.post('/recruitments/:id/apply', async (req, res) => {
  try {
    const recruitment = await Recruitment.findById(req.params.id).populate('club');
    if (!recruitment || recruitment.status !== 'Open') {
      req.flash('error_msg', 'Recruitment drive is no longer open.');
      return res.redirect('/clubs');
    }

    const {
      appliedRole,
      rollNo,
      department,
      year,
      phone,
      cgpa,
      skills,
      priorExperience,
      whyJoin,
      portfolioLink
    } = req.body;

    if (!appliedRole || !rollNo || !skills || !whyJoin) {
      req.flash('error_msg', 'Please fill in all mandatory fields.');
      return res.redirect(`/student/recruitments/${recruitment._id}/apply`);
    }

    const existingApp = await Application.findOne({
      recruitment: recruitment._id,
      student: req.session.user._id
    });

    if (existingApp) {
      req.flash('error_msg', 'You have already submitted an application.');
      return res.redirect('/student/applications');
    }

    const application = new Application({
      recruitment: recruitment._id,
      club: recruitment.club._id,
      student: req.session.user._id,
      appliedRole,
      studentName: req.session.user.name,
      rollNo: rollNo.toUpperCase().trim(),
      department: department || req.session.user.department,
      year: parseInt(year, 10) || req.session.user.year,
      email: req.session.user.email,
      phone: phone || req.session.user.phone,
      cgpa: parseFloat(cgpa) || 8.0,
      skills,
      priorExperience: priorExperience || 'None',
      whyJoin,
      portfolioLink: portfolioLink || '',
      status: 'Submitted'
    });

    await application.save();

    // Notify student
    await Notification.create({
      recipient: req.session.user._id,
      club: recruitment.club._id,
      title: `Application Submitted: ${recruitment.club.name}`,
      message: `Your application for "${appliedRole}" at ${recruitment.club.name} was successfully submitted. You can track status on your dashboard.`,
      type: 'recruitment',
      relatedLink: '/student/applications'
    });

    // Notify club secretary if assigned
    if (recruitment.club.secretary && recruitment.club.secretary.user) {
      await Notification.create({
        recipient: recruitment.club.secretary.user,
        club: recruitment.club._id,
        title: `New Applicant: ${req.session.user.name}`,
        message: `${req.session.user.name} (${rollNo}) has applied for "${appliedRole}".`,
        type: 'application',
        relatedLink: '/secretary/applications'
      });
    }

    req.flash('success_msg', 'Application submitted successfully! Track your status below.');
    res.redirect('/student/applications');
  } catch (error) {
    console.error('Submit Application Error:', error);
    req.flash('error_msg', 'Failed to submit application: ' + error.message);
    res.redirect(`/student/recruitments/${req.params.id}/apply`);
  }
});

// GET /student/applications - Track Application Status Module
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find({ student: req.session.user._id })
      .populate('club')
      .populate('recruitment')
      .sort({ submittedAt: -1 });

    res.render('student/applications', {
      title: 'Track Recruitment Applications - ClubSphere',
      applications,
      currentPage: 'applications'
    });
  } catch (error) {
    console.error('Fetch Applications Error:', error);
    req.flash('error_msg', 'Could not fetch your applications.');
    res.redirect('/student/dashboard');
  }
});

// GET /student/notifications - Notification Module
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ recipient: req.session.user._id }, { recipient: null }]
    })
      .populate('club', 'name code logo')
      .sort({ createdAt: -1 });

    res.render('student/notifications', {
      title: 'Notifications - ClubSphere',
      notifications,
      currentPage: 'notifications'
    });
  } catch (error) {
    console.error('Notifications Error:', error);
    req.flash('error_msg', 'Could not load notifications.');
    res.redirect('/student/dashboard');
  }
});

// POST /student/notifications/:id/read - Mark notification as read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

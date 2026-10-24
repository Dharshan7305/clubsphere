const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Application = require('../models/Application');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect all secretary routes
router.use(ensureAuthenticated, authorizeRoles('secretary', 'admin'));

// Helper to get secretary's club
async function getSecretaryClub(req) {
  if (req.session.user.role === 'admin') {
    // If admin is viewing secretary views, take first club or specific query
    const clubId = req.query.clubId || req.session.user.club?._id;
    if (clubId) return await Club.findById(clubId);
    return await Club.findOne();
  }
  return await Club.findOne({
    $or: [
      { _id: req.session.user.club?._id },
      { 'secretary.user': req.session.user._id },
      { 'secretary.email': req.session.user.email }
    ]
  });
}

// GET /secretary/dashboard - Secretary Dashboard Module
router.get('/dashboard', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to manage any club. Please contact Admin.');
      return res.redirect('/');
    }

    const recruitments = await Recruitment.find({ club: club._id }).sort({ createdAt: -1 });
    const recruitmentIds = recruitments.map(r => r._id);

    const applications = await Application.find({ recruitment: { $in: recruitmentIds } })
      .populate('recruitment')
      .populate('student', 'name email rollNo department')
      .sort({ submittedAt: -1 });

    const events = await Event.find({ club: club._id }).sort({ eventDate: -1 });

    // Metrics
    const totalApplicants = applications.length;
    const pendingApplicants = applications.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length;
    const shortlistedApplicants = applications.filter(a => a.status === 'Shortlisted').length;
    const acceptedApplicants = applications.filter(a => a.status === 'Accepted').length;
    const totalEventRegistrations = events.reduce((sum, e) => sum + e.participants.length, 0);

    res.render('secretary/dashboard', {
      title: `${club.name} - Secretary Dashboard`,
      club,
      recruitments,
      applications: applications.slice(0, 8),
      events: events.slice(0, 5),
      metrics: {
        totalApplicants,
        pendingApplicants,
        shortlistedApplicants,
        acceptedApplicants,
        totalEvents: events.length,
        totalEventRegistrations
      },
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Secretary Dashboard Error:', error);
    req.flash('error_msg', 'Could not load secretary dashboard.');
    res.redirect('/');
  }
});

// GET /secretary/club - Manage Club Profile
router.get('/club', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'No club assigned to manage.');
      return res.redirect('/secretary/dashboard');
    }

    res.render('secretary/manage-club', {
      title: `Manage ${club.name} - Profile`,
      club,
      currentPage: 'club'
    });
  } catch (error) {
    console.error('Manage Club Error:', error);
    req.flash('error_msg', 'Error retrieving club profile.');
    res.redirect('/secretary/dashboard');
  }
});

// POST /secretary/club - Update Club Profile
router.post('/club', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'No club assigned to manage.');
      return res.redirect('/secretary/dashboard');
    }

    const { tagline, description, objectives, contactEmail, instagram, linkedin, recruitmentStatus } = req.body;

    club.tagline = tagline || club.tagline;
    club.description = description || club.description;
    club.contactEmail = contactEmail || club.contactEmail;
    club.instagram = instagram || club.instagram;
    club.linkedin = linkedin || club.linkedin;
    club.recruitmentStatus = recruitmentStatus || club.recruitmentStatus;

    if (objectives) {
      club.objectives = objectives.split('\n').map(o => o.trim()).filter(o => o.length > 0);
    }

    await club.save();
    req.flash('success_msg', 'Club profile updated successfully!');
    res.redirect('/secretary/club');
  } catch (error) {
    console.error('Update Club Error:', error);
    req.flash('error_msg', 'Failed to update club profile: ' + error.message);
    res.redirect('/secretary/club');
  }
});

// GET /secretary/recruitments - Post & Manage Recruitment Drives
router.get('/recruitments', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    const recruitments = await Recruitment.find({ club: club._id })
      .populate('facultyApproval.reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.render('secretary/recruitments', {
      title: `Recruitments - ${club.name}`,
      club,
      recruitments,
      currentPage: 'recruitments'
    });
  } catch (error) {
    console.error('Recruitments Error:', error);
    req.flash('error_msg', 'Error loading recruitment drives.');
    res.redirect('/secretary/dashboard');
  }
});

// POST /secretary/recruitments - Create Recruitment Drive
router.post('/recruitments', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    const { title, academicYear, eligibility, deadline, instructions, rolesText } = req.body;

    // Parse roles (Format per line: Role Name | Vacancies | Requirements)
    let roles = [];
    if (rolesText) {
      const lines = rolesText.split('\n');
      lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts[0]) {
          roles.push({
            roleName: parts[0],
            vacancies: parseInt(parts[1], 10) || 5,
            requirements: parts[2] || 'Good teamwork & enthusiasm'
          });
        }
      });
    }

    if (roles.length === 0) {
      roles.push({ roleName: 'Core Member', vacancies: 5, requirements: 'Enthusiastic and committed student' });
    }

    const recruitment = new Recruitment({
      club: club._id,
      title: title.trim(),
      academicYear: academicYear || '2025-2026',
      roles,
      eligibility: eligibility || 'Open to all college students',
      deadline: new Date(deadline),
      instructions: instructions || 'Submit your application on ClubSphere before deadline.',
      status: 'Pending Approval', // Faculty Advisor must approve per ClubSphere process
      facultyApproval: {
        status: 'Pending',
        remarks: 'Submitted for faculty advisor verification'
      },
      postedBy: req.session.user._id
    });

    await recruitment.save();

    // Alert Faculty Advisor if assigned
    if (club.facultyAdvisor && club.facultyAdvisor.user) {
      await Notification.create({
        recipient: club.facultyAdvisor.user,
        club: club._id,
        title: `Recruitment Approval Needed: ${club.name}`,
        message: `${club.secretary.name} has submitted a new recruitment drive "${title}" for your approval.`,
        type: 'recruitment',
        relatedLink: '/faculty/recruitments'
      });
    }

    req.flash('success_msg', 'Recruitment announcement created! Submitted for Faculty Advisor approval.');
    res.redirect('/secretary/recruitments');
  } catch (error) {
    console.error('Create Recruitment Error:', error);
    req.flash('error_msg', 'Failed to create recruitment drive: ' + error.message);
    res.redirect('/secretary/recruitments');
  }
});

// GET /secretary/applications - View and Filter Applicants
router.get('/applications', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/secretary/dashboard');
    }

    const { status, role, search } = req.query;
    let query = { club: club._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (role && role !== 'All') {
      query.appliedRole = role;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { studentName: searchRegex },
        { rollNo: searchRegex },
        { department: searchRegex },
        { skills: searchRegex }
      ];
    }

    const applications = await Application.find(query)
      .populate('recruitment')
      .populate('student')
      .sort({ submittedAt: -1 });

    // Distinct roles for filter
    const distinctRoles = await Application.distinct('appliedRole', { club: club._id });

    res.render('secretary/applicants', {
      title: `Applicants - ${club.name}`,
      club,
      applications,
      distinctRoles,
      selectedStatus: status || 'All',
      selectedRole: role || 'All',
      searchQuery: search || '',
      currentPage: 'applications'
    });
  } catch (error) {
    console.error('Applicants Error:', error);
    req.flash('error_msg', 'Error retrieving applicants list.');
    res.redirect('/secretary/dashboard');
  }
});

// POST /secretary/applications/:id/status - Update Applicant Status (Accept/Reject/Shortlist)
router.post('/applications/:id/status', async (req, res) => {
  try {
    const { status, secretaryNotes, interviewDate, interviewVenue } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('club')
      .populate('student');

    if (!application) {
      req.flash('error_msg', 'Application not found.');
      return res.redirect('/secretary/applications');
    }

    application.status = status;
    if (secretaryNotes) application.secretaryNotes = secretaryNotes;
    if (interviewDate) application.interviewDate = new Date(interviewDate);
    if (interviewVenue) application.interviewVenue = interviewVenue;

    await application.save();

    // Create Notification for the student
    let notifTitle = `Application Update: ${application.club.name}`;
    let notifMessage = `Your application for "${application.appliedRole}" has been updated to "${status}".`;

    if (status === 'Shortlisted' && interviewDate) {
      notifMessage += ` Interview scheduled on ${new Date(interviewDate).toLocaleDateString()} at ${interviewVenue || 'Club Room'}.`;
    } else if (status === 'Accepted') {
      notifMessage += ` Congratulations! You have been selected as a member of ${application.club.name}. Welcome aboard!`;
    }

    await Notification.create({
      recipient: application.student._id,
      club: application.club._id,
      title: notifTitle,
      message: notifMessage,
      type: 'application',
      relatedLink: '/student/applications'
    });

    req.flash('success_msg', `Status for ${application.studentName} updated to "${status}". Notification sent!`);
    res.redirect('/secretary/applications');
  } catch (error) {
    console.error('Status Update Error:', error);
    req.flash('error_msg', 'Failed to update application status.');
    res.redirect('/secretary/applications');
  }
});

// GET /secretary/events - Manage Events
router.get('/events', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    const events = await Event.find({ club: club._id }).sort({ eventDate: -1 });

    res.render('secretary/events', {
      title: `Events - ${club.name}`,
      club,
      events,
      currentPage: 'events'
    });
  } catch (error) {
    console.error('Events list error:', error);
    req.flash('error_msg', 'Could not fetch events.');
    res.redirect('/secretary/dashboard');
  }
});

// GET /secretary/events/new - Create Event Page
router.get('/events/new', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    res.render('secretary/create-event', {
      title: `Create Event - ${club.name}`,
      club,
      currentPage: 'events'
    });
  } catch (error) {
    req.flash('error_msg', 'Error displaying event creation form.');
    res.redirect('/secretary/events');
  }
});

// POST /secretary/events - Save Event
router.post('/events', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    const { title, category, description, venue, eventDate, startTime, endTime, registrationDeadline, maxParticipants } = req.body;

    const event = new Event({
      club: club._id,
      title: title.trim(),
      category: category || 'Workshop',
      description,
      venue: venue || 'Campus',
      eventDate: new Date(eventDate),
      startTime: startTime || '09:30 AM',
      endTime: endTime || '04:30 PM',
      registrationDeadline: new Date(registrationDeadline),
      maxParticipants: parseInt(maxParticipants, 10) || 100,
      createdBy: req.session.user._id,
      status: 'Upcoming'
    });

    await event.save();

    // Broadcast notification to all students
    await Notification.create({
      recipient: null, // broadcast
      club: club._id,
      title: `New Event Announced: ${title}`,
      message: `${club.name} is hosting "${title}" on ${new Date(eventDate).toLocaleDateString()} at ${venue}. Registrations now open!`,
      type: 'event',
      relatedLink: `/events/${event._id}`
    });

    req.flash('success_msg', 'Event published successfully and broadcasted to students!');
    res.redirect('/secretary/events');
  } catch (error) {
    console.error('Create Event Error:', error);
    req.flash('error_msg', 'Failed to create event: ' + error.message);
    res.redirect('/secretary/events/new');
  }
});

// POST /secretary/announcement - Send Announcement
router.post('/announcement', async (req, res) => {
  try {
    const club = await getSecretaryClub(req);
    const { title, message } = req.body;

    if (!title || !message) {
      req.flash('error_msg', 'Announcement title and message are required.');
      return res.redirect('/secretary/dashboard');
    }

    await Notification.create({
      recipient: null, // broadcast to all
      club: club._id,
      title: `Announcement from ${club.name}: ${title}`,
      message,
      type: 'announcement',
      relatedLink: `/clubs/${club._id}`
    });

    req.flash('success_msg', 'Announcement broadcasted successfully to all students!');
    res.redirect('/secretary/dashboard');
  } catch (error) {
    console.error('Announcement Error:', error);
    req.flash('error_msg', 'Failed to send announcement.');
    res.redirect('/secretary/dashboard');
  }
});

module.exports = router;

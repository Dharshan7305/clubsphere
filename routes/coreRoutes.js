const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Event = require('../models/Event');
const Application = require('../models/Application');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect all core member routes (allow core, secretary, admin)
router.use(ensureAuthenticated, authorizeRoles('core', 'secretary', 'admin'));

// Helper to get club associated with core member
async function getCoreClub(req) {
  if (req.session.user.role === 'admin') {
    const clubId = req.query.clubId || req.session.user.club?._id;
    if (clubId) return await Club.findById(clubId);
    return await Club.findOne();
  }
  return await Club.findOne({
    $or: [
      { _id: req.session.user.club?._id },
      { 'coreTeam.user': req.session.user._id }
    ]
  });
}

// GET /core/dashboard - Core Member Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned to a club team yet. Please contact your Secretary or Admin.');
      return res.redirect('/');
    }

    const events = await Event.find({ club: club._id }).sort({ eventDate: 1 });
    const applications = await Application.find({ club: club._id }).sort({ submittedAt: -1 }).limit(10);

    const totalParticipants = events.reduce((sum, e) => sum + e.participants.length, 0);

    res.render('core/dashboard', {
      title: `Core Team Portal - ${club.name}`,
      club,
      events,
      applications,
      totalParticipants,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Core Dashboard Error:', error);
    req.flash('error_msg', 'Could not load core member dashboard.');
    res.redirect('/');
  }
});

// GET /core/events/:id/participants - View and Check-In Participants
router.get('/events/:id/participants', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    const event = await Event.findOne({ _id: req.params.id, club: club._id });

    if (!event) {
      req.flash('error_msg', 'Event not found or not in your club.');
      return res.redirect('/core/dashboard');
    }

    res.render('core/event-participants', {
      title: `Participants: ${event.title}`,
      club,
      event,
      currentPage: 'events'
    });
  } catch (error) {
    console.error('Participants list error:', error);
    req.flash('error_msg', 'Could not retrieve participant list.');
    res.redirect('/core/dashboard');
  }
});

// POST /core/events/:id/attendance/:participantId - Toggle Attendance Check-In
router.post('/events/:id/attendance/:participantId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const participant = event.participants.id(req.params.participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    participant.attended = !participant.attended;
    await event.save();

    res.json({ success: true, attended: participant.attended });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /core/events/:id/update - Update Event Details
router.post('/events/:id/update', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    const event = await Event.findOne({ _id: req.params.id, club: club._id });

    if (!event) {
      req.flash('error_msg', 'Event not found.');
      return res.redirect('/core/dashboard');
    }

    const { venue, eventDate, startTime, endTime, status, description } = req.body;
    if (venue) event.venue = venue;
    if (eventDate) event.eventDate = new Date(eventDate);
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (status) event.status = status;
    if (description) event.description = description;

    await event.save();
    req.flash('success_msg', 'Event details updated successfully!');
    res.redirect(`/core/events/${event._id}/participants`);
  } catch (error) {
    console.error('Update event error:', error);
    req.flash('error_msg', 'Failed to update event.');
    res.redirect('/core/dashboard');
  }
});

// GET /core/applications - View recruitment applications (Read-Only review)
router.get('/applications', async (req, res) => {
  try {
    const club = await getCoreClub(req);
    const applications = await Application.find({ club: club._id })
      .populate('recruitment')
      .sort({ submittedAt: -1 });

    res.render('core/applications', {
      title: `Recruitment Applications - ${club.name}`,
      club,
      applications,
      currentPage: 'applications'
    });
  } catch (error) {
    console.error('Applications list error:', error);
    req.flash('error_msg', 'Could not load applications.');
    res.redirect('/core/dashboard');
  }
});

module.exports = router;

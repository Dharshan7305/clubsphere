const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect faculty routes (allow faculty and admin)
router.use(ensureAuthenticated, authorizeRoles('faculty', 'admin'));

// Helper to get faculty's club
async function getFacultyClub(req) {
  if (req.session.user.role === 'admin') {
    const clubId = req.query.clubId || req.session.user.club?._id;
    if (clubId) return await Club.findById(clubId);
    return await Club.findOne();
  }
  return await Club.findOne({
    $or: [
      { _id: req.session.user.club?._id },
      { 'facultyAdvisor.user': req.session.user._id },
      { 'facultyAdvisor.email': req.session.user.email }
    ]
  });
}

// GET /faculty/dashboard - Faculty Advisor Module
router.get('/dashboard', async (req, res) => {
  try {
    const club = await getFacultyClub(req);
    if (!club) {
      req.flash('error_msg', 'You are not assigned as Faculty Advisor to any club. Please contact Admin.');
      return res.redirect('/');
    }

    const pendingRecruitments = await Recruitment.find({
      club: club._id,
      status: 'Pending Approval'
    }).sort({ createdAt: -1 });

    const allRecruitments = await Recruitment.find({ club: club._id }).sort({ createdAt: -1 });
    const events = await Event.find({ club: club._id }).sort({ eventDate: -1 });

    res.render('faculty/dashboard', {
      title: `Faculty Advisor Portal - ${club.name}`,
      club,
      pendingRecruitments,
      allRecruitments,
      events,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Faculty Dashboard Error:', error);
    req.flash('error_msg', 'Could not load faculty dashboard.');
    res.redirect('/');
  }
});

// GET /faculty/recruitments - View recruitment drives to review
router.get('/recruitments', async (req, res) => {
  try {
    const club = await getFacultyClub(req);
    const recruitments = await Recruitment.find({ club: club._id }).sort({ createdAt: -1 });

    res.render('faculty/recruitments', {
      title: `Recruitment Approvals - ${club.name}`,
      club,
      recruitments,
      currentPage: 'recruitments'
    });
  } catch (error) {
    console.error('Faculty recruitments error:', error);
    req.flash('error_msg', 'Could not load recruitments.');
    res.redirect('/faculty/dashboard');
  }
});

// POST /faculty/recruitments/:id/review - Approve or Reject recruitment drive
router.post('/recruitments/:id/review', async (req, res) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' or 'reject'
    const recruitment = await Recruitment.findById(req.params.id).populate('club');

    if (!recruitment) {
      req.flash('error_msg', 'Recruitment drive not found.');
      return res.redirect('/faculty/dashboard');
    }

    recruitment.facultyApproval = {
      status: action === 'approve' ? 'Approved' : 'Rejected',
      reviewedBy: req.session.user._id,
      remarks: remarks || (action === 'approve' ? 'Approved by Faculty Advisor.' : 'Needs revision.'),
      reviewedAt: new Date()
    };

    if (action === 'approve') {
      recruitment.status = 'Open';
      // Also update club recruitmentStatus to Open
      await Club.findByIdAndUpdate(recruitment.club._id, { recruitmentStatus: 'Open' });
    } else {
      recruitment.status = 'Draft';
    }

    await recruitment.save();

    // Notify club secretary
    if (recruitment.club.secretary && recruitment.club.secretary.user) {
      await Notification.create({
        recipient: recruitment.club.secretary.user,
        club: recruitment.club._id,
        title: `Recruitment ${action === 'approve' ? 'Approved' : 'Rejected'}: ${recruitment.title}`,
        message: `Faculty Advisor has ${action === 'approve' ? 'approved' : 'rejected'} the recruitment drive. Remarks: "${remarks || 'None'}".`,
        type: 'recruitment',
        relatedLink: '/secretary/recruitments'
      });
    }

    // If approved, broadcast to all students
    if (action === 'approve') {
      await Notification.create({
        recipient: null, // broadcast to all
        club: recruitment.club._id,
        title: `Recruitment Open: ${recruitment.club.name}!`,
        message: `${recruitment.club.name} is now recruiting for "${recruitment.title}". Deadline: ${new Date(recruitment.deadline).toLocaleDateString()}. Apply now on ClubSphere!`,
        type: 'recruitment',
        relatedLink: `/student/recruitments/${recruitment._id}/apply`
      });
    }

    req.flash('success_msg', `Recruitment drive successfully ${action === 'approve' ? 'approved and opened for applications' : 'returned for revision'}!`);
    res.redirect('/faculty/dashboard');
  } catch (error) {
    console.error('Faculty Review Error:', error);
    req.flash('error_msg', 'Error processing approval.');
    res.redirect('/faculty/dashboard');
  }
});

module.exports = router;

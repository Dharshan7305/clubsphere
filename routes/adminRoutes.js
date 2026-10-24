const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User');
const Recruitment = require('../models/Recruitment');
const Application = require('../models/Application');
const Event = require('../models/Event');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');

// Protect all admin routes
router.use(ensureAuthenticated, authorizeRoles('admin'));

// GET /admin/dashboard - Admin Dashboard Module
router.get('/dashboard', async (req, res) => {
  try {
    const totalClubs = await Club.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRecruitments = await Recruitment.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Category breakdown
    const categoryStats = await Club.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent clubs & recruitments
    const recentClubs = await Club.find().sort({ createdAt: -1 }).limit(5);
    const recentApplications = await Application.find()
      .populate('club', 'name code')
      .populate('student', 'name rollNo')
      .sort({ submittedAt: -1 })
      .limit(6);

    res.render('admin/dashboard', {
      title: 'Administrator Control Center - ClubSphere',
      stats: {
        totalClubs,
        totalUsers,
        totalStudents,
        totalRecruitments,
        totalApplications,
        totalEvents
      },
      categoryStats,
      recentClubs,
      recentApplications,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    req.flash('error_msg', 'Could not load admin dashboard.');
    res.redirect('/');
  }
});

// GET /admin/clubs - Manage all clubs
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    const facultyUsers = await User.find({ role: 'faculty' }).select('name email');
    const secretaryUsers = await User.find({ role: 'secretary' }).select('name email rollNo');

    res.render('admin/clubs', {
      title: 'Manage Clubs - Admin | ClubSphere',
      clubs,
      facultyUsers,
      secretaryUsers,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Admin Clubs Error:', error);
    req.flash('error_msg', 'Could not fetch clubs list.');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/clubs/add - Add New Club
router.post('/clubs/add', async (req, res) => {
  try {
    const { name, code, category, tagline, description, objectives, contactEmail, facultyName, facultyEmail, secretaryName, secretaryEmail } = req.body;

    const existing = await Club.findOne({ $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }] });
    if (existing) {
      req.flash('error_msg', 'A club with this name or code already exists.');
      return res.redirect('/admin/clubs');
    }

    const objList = objectives ? objectives.split('\n').map(o => o.trim()).filter(o => o.length > 0) : [];

    const club = new Club({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      category: category || 'Technical',
      tagline: tagline || 'College Student Club',
      description: description || 'Club dedicated to student innovation and skill enhancement at ClubSphere.',
      objectives: objList,
      contactEmail: contactEmail || 'club@college.ac.in',
      facultyAdvisor: {
        name: facultyName || 'Dr. Faculty Advisor',
        email: facultyEmail || 'faculty@college.ac.in'
      },
      secretary: {
        name: secretaryName || 'Student Secretary',
        email: secretaryEmail || 'secretary@college.ac.in'
      }
    });

    await club.save();
    req.flash('success_msg', `Club "${club.name}" created successfully!`);
    res.redirect('/admin/clubs');
  } catch (error) {
    console.error('Add Club Error:', error);
    req.flash('error_msg', 'Failed to add club: ' + error.message);
    res.redirect('/admin/clubs');
  }
});

// POST /admin/clubs/:id/edit - Edit Club
router.post('/clubs/:id/edit', async (req, res) => {
  try {
    const { name, category, tagline, description, contactEmail, recruitmentStatus, isActive } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/admin/clubs');
    }

    club.name = name ? name.trim() : club.name;
    club.category = category || club.category;
    club.tagline = tagline || club.tagline;
    club.description = description || club.description;
    club.contactEmail = contactEmail || club.contactEmail;
    club.recruitmentStatus = recruitmentStatus || club.recruitmentStatus;
    club.isActive = isActive === 'true' || isActive === true;

    await club.save();
    req.flash('success_msg', `Club "${club.name}" updated successfully!`);
    res.redirect('/admin/clubs');
  } catch (error) {
    console.error('Edit Club Error:', error);
    req.flash('error_msg', 'Failed to update club: ' + error.message);
    res.redirect('/admin/clubs');
  }
});

// POST /admin/clubs/:id/delete - Delete Club
router.post('/admin/clubs/:id/delete', async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    req.flash('success_msg', `Club "${club.name}" deleted successfully.`);
    res.redirect('/admin/clubs');
  } catch (error) {
    console.error('Delete Club Error:', error);
    req.flash('error_msg', 'Failed to delete club.');
    res.redirect('/admin/clubs');
  }
});

// GET /admin/users - Manage Users
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role && role !== 'All') {
      query.role = role;
    }

    const users = await User.find(query).populate('club', 'name code').sort({ name: 1 });
    const clubs = await Club.find().select('name code');

    res.render('admin/users', {
      title: 'Manage Users - Admin | ClubSphere',
      users,
      clubs,
      selectedRole: role || 'All',
      currentPage: 'users'
    });
  } catch (error) {
    console.error('Admin Users Error:', error);
    req.flash('error_msg', 'Could not load users list.');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/users/:id/role - Update User Role & Club Assignment
router.post('/users/:id/role', async (req, res) => {
  try {
    const { role, clubId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('/admin/users');
    }

    user.role = role;
    user.club = (clubId && clubId !== '') ? clubId : null;
    await user.save();

    // If assigned to club as secretary, link into Club record
    if (role === 'secretary' && clubId) {
      await Club.findByIdAndUpdate(clubId, {
        'secretary.name': user.name,
        'secretary.rollNo': user.rollNo,
        'secretary.email': user.email,
        'secretary.user': user._id
      });
    }

    // If assigned as faculty, link into Club record
    if (role === 'faculty' && clubId) {
      await Club.findByIdAndUpdate(clubId, {
        'facultyAdvisor.name': user.name,
        'facultyAdvisor.email': user.email,
        'facultyAdvisor.user': user._id
      });
    }

    req.flash('success_msg', `Role for ${user.name} updated to ${role}.`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Update User Error:', error);
    req.flash('error_msg', 'Failed to update user.');
    res.redirect('/admin/users');
  }
});

// GET /admin/reports - Generate Reports Module
router.get('/reports', async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    const recruitments = await Recruitment.find().populate('club', 'name code').sort({ createdAt: -1 });
    const events = await Event.find().populate('club', 'name code').sort({ eventDate: -1 });
    const applications = await Application.find().populate('club', 'name code').populate('student', 'name rollNo');

    // Aggregate statistics
    const stats = {
      totalClubs: clubs.length,
      activeClubs: clubs.filter(c => c.isActive).length,
      openRecruitments: recruitments.filter(r => r.status === 'Open').length,
      totalApplications: applications.length,
      acceptedApplications: applications.filter(a => a.status === 'Accepted').length,
      totalEvents: events.length,
      totalRegistrations: events.reduce((sum, e) => sum + e.participants.length, 0)
    };

    res.render('admin/reports', {
      title: 'Platform Analytics & Viva Reports - ClubSphere',
      stats,
      clubs,
      recruitments,
      events,
      currentPage: 'reports'
    });
  } catch (error) {
    console.error('Reports Error:', error);
    req.flash('error_msg', 'Could not generate reports.');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;

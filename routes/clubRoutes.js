const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Recruitment = require('../models/Recruitment');
const Event = require('../models/Event');
const User = require('../models/User');

// GET /clubs - Club Discovery Module
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    const clubs = await Club.find(query).sort({ name: 1 });
    const categories = ['All', 'Technical', 'Cultural', 'Social & NSS', 'Sports', 'Literary & Media', 'Entrepreneurship'];

    // Check saved clubs if student is logged in
    let savedClubIds = [];
    if (req.session.user) {
      const user = await User.findById(req.session.user._id).select('savedClubs');
      if (user && user.savedClubs) {
        savedClubIds = user.savedClubs.map(id => id.toString());
      }
    }

    res.render('clubs/index', {
      title: 'Discover College Clubs - ClubSphere',
      clubs,
      categories,
      selectedCategory: category || 'All',
      searchQuery: search || '',
      savedClubIds,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    req.flash('error_msg', 'Could not load clubs. Please try again.');
    res.redirect('/');
  }
});

// GET /clubs/:id - Club Details Module
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('facultyAdvisor.user', 'name email')
      .populate('secretary.user', 'name rollNo email')
      .populate('coreTeam.user', 'name rollNo email');

    if (!club) {
      req.flash('error_msg', 'Club not found.');
      return res.redirect('/clubs');
    }

    // Fetch active recruitments for this club (status === 'Open')
    const recruitments = await Recruitment.find({
      club: club._id,
      status: 'Open'
    }).sort({ deadline: 1 });

    // Fetch upcoming events for this club
    const upcomingEvents = await Event.find({
      club: club._id,
      status: { $in: ['Upcoming', 'Ongoing'] }
    }).sort({ eventDate: 1 });

    // Check if current user saved this club
    let isSaved = false;
    if (req.session.user) {
      const user = await User.findById(req.session.user._id).select('savedClubs');
      if (user && user.savedClubs) {
        isSaved = user.savedClubs.some(id => id.toString() === club._id.toString());
      }
    }

    res.render('clubs/show', {
      title: `${club.name} - Club Details | ClubSphere`,
      club,
      recruitments,
      upcomingEvents,
      isSaved,
      currentPage: 'clubs'
    });
  } catch (error) {
    console.error('Error fetching club details:', error);
    req.flash('error_msg', 'Invalid club ID or server error.');
    res.redirect('/clubs');
  }
});

// POST /clubs/:id/save - Toggle Save / Bookmark Club
router.post('/:id/save', async (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to save clubs.');
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.user._id);
    const clubId = req.params.id;

    const index = user.savedClubs.indexOf(clubId);
    if (index > -1) {
      user.savedClubs.splice(index, 1);
      req.flash('success_msg', 'Club removed from your saved list.');
    } else {
      user.savedClubs.push(clubId);
      req.flash('success_msg', 'Club added to your saved list!');
    }

    await user.save();
    res.redirect(req.headers.referer || `/clubs/${clubId}`);
  } catch (error) {
    console.error('Error toggling saved club:', error);
    req.flash('error_msg', 'Could not update saved club.');
    res.redirect(`/clubs/${req.params.id}`);
  }
});

module.exports = router;

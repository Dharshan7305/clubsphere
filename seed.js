const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Club = require('./models/Club');
const Recruitment = require('./models/Recruitment');
const Application = require('./models/Application');
const Event = require('./models/Event');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clubsphere';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing collections
    await User.deleteMany({});
    await Club.deleteMany({});
    await Recruitment.deleteMany({});
    await Application.deleteMany({});
    await Event.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    // Default password hash
    const salt = await bcrypt.genSalt(10);
    const commonHashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create Base Users for All 5 Roles
    const adminUser = await User.create({
      name: 'Dr. Dean Student Affairs',
      email: 'admin@college.ac.in',
      password: 'password123',
      role: 'admin',
      department: 'Dean Office',
      phone: '9842100001'
    });

    const facultyUser = await User.create({
      name: 'Dr. R. Venkatesh',
      email: 'faculty@college.ac.in',
      password: 'password123',
      role: 'faculty',
      department: 'Computer Science & Engineering',
      phone: '9842100002'
    });

    const secretaryUser = await User.create({
      name: 'Arun Kumar S',
      email: 'secretary@college.ac.in',
      password: 'password123',
      role: 'secretary',
      rollNo: '22CS102',
      department: 'Computer Science & Engineering',
      year: 3,
      phone: '9842100003'
    });

    const coreUser = await User.create({
      name: 'Kavitha M',
      email: 'core@college.ac.in',
      password: 'password123',
      role: 'core',
      rollNo: '23MX115',
      department: 'Computer Applications',
      year: 2,
      phone: '9842100004'
    });

    const studentUser = await User.create({
      name: 'Dharshan R',
      email: 'student@college.ac.in',
      password: 'password123',
      role: 'student',
      rollNo: '24MX108',
      department: 'Computer Applications',
      year: 1,
      phone: '9842100005'
    });

    console.log('[Seed] Created default users for all 5 roles.');

    // 2. Create College Clubs
    const clubsData = [
      {
        name: 'Coding Club ClubSphere',
        code: 'CC',
        category: 'Technical',
        tagline: 'Fostering competitive programming, web development, and algorithmic brilliance.',
        description: 'The official Coding Club of College of Technology is a vibrant student body dedicated to nurturing software engineering, algorithmic thinking, open-source development, and hackathons.',
        objectives: [
          'Conduct weekly competitive programming bootcamps and ICPC prep',
          'Organize 24-hour national level hackathons like CodeStorm',
          'Mentor junior students in Data Structures, Web, and Cloud Development',
          'Facilitate industry tech talks and collaborative student projects'
        ],
        facultyAdvisor: {
          name: 'Dr. R. Venkatesh',
          designation: 'Associate Professor, CSE',
          department: 'CSE',
          email: 'faculty@college.ac.in',
          user: facultyUser._id
        },
        secretary: {
          name: 'Arun Kumar S',
          rollNo: '22CS102',
          email: 'secretary@college.ac.in',
          user: secretaryUser._id
        },
        coreTeam: [
          {
            name: 'Kavitha M',
            designation: 'Technical Lead',
            rollNo: '23MX115',
            user: coreUser._id
          },
          {
            name: 'Sanjay Krishnan',
            designation: 'Events Lead',
            rollNo: '22IT144'
          }
        ],
        recruitmentStatus: 'Open',
        contactEmail: 'codingclub@college.ac.in',
        instagram: 'https://instagram.com/codingclub_clubsphere',
        linkedin: 'https://linkedin.com/company/codingclub-clubsphere',
        foundedYear: 2012,
        isActive: true
      },
      {
        name: 'Robotics & Automation Club',
        code: 'RAC',
        category: 'Technical',
        tagline: 'Designing tomorrow’s intelligent autonomous machines and robotics.',
        description: 'ClubSphere Robotics and Automation Club builds robotic platforms, autonomous rovers, and mechatronic systems for national and international robotics competitions.',
        objectives: [
          'Hands-on training on ROS, Arduino, Raspberry Pi, and Embedded C',
          'Develop autonomous line followers, drones, and combat bots',
          'Participate in IIT Techfests and international Robocon'
        ],
        facultyAdvisor: {
          name: 'Dr. K. Senthil Kumar',
          designation: 'Professor, Robotics & Automation',
          department: 'Robotics',
          email: 'ksk@college.ac.in'
        },
        secretary: {
          name: 'Pradeep Raj',
          rollNo: '22RA118',
          email: 'pradeep@college.ac.in'
        },
        coreTeam: [
          { name: 'Naveen Kumar', designation: 'Hardware Lead', rollNo: '23RA120' }
        ],
        recruitmentStatus: 'Open',
        contactEmail: 'robotics@college.ac.in',
        foundedYear: 2008,
        isActive: true
      },
      {
        name: 'Rotaract Club of ClubSphere',
        code: 'RCC',
        category: 'Social & NSS',
        tagline: 'Self-Development - Fellowship Through Service.',
        description: 'Chartered under Rotary International, Rotaract Club of ClubSphere is one of the oldest and most impactful youth service organizations focusing on community welfare and leadership.',
        objectives: [
          'Organize regular blood donation drives and health screening camps',
          'Educational support for government school children',
          'Environmental preservation, tree planting, and sustainability workshops'
        ],
        facultyAdvisor: {
          name: 'Dr. G. Radhakrishnan',
          designation: 'Associate Professor, Mechanical',
          email: 'grk@college.ac.in'
        },
        secretary: {
          name: 'Deepika S',
          rollNo: '22EC135',
          email: 'deepika@college.ac.in'
        },
        recruitmentStatus: 'Open',
        contactEmail: 'rotaract@college.ac.in',
        foundedYear: 1985,
        isActive: true
      },
      {
        name: 'Dramatix - English Drama Club',
        code: 'DRAMA',
        category: 'Cultural',
        tagline: 'Where emotions meet stagecraft and theatrical passion.',
        description: 'ClubSphere Dramatix is the premier theatre and performing arts club, staging annual theatrical productions, street plays, mime, and comedy sketches.',
        objectives: [
          'Produce high quality plays and street performances',
          'Train students in scriptwriting, voice modulation, and stage production',
          'Represent ClubSphere in national cultural festivals'
        ],
        recruitmentStatus: 'Closed',
        contactEmail: 'dramatix@college.ac.in',
        foundedYear: 1998,
        isActive: true
      },
      {
        name: 'Entrepreneurs Club (E-Cell)',
        code: 'ECELL',
        category: 'Entrepreneurship',
        tagline: 'Igniting student startups and entrepreneurial ventures.',
        description: 'E-Cell ClubSphere is dedicated to building a thriving startup ecosystem, connecting student founders with venture capitalists, alumni angels, and incubators.',
        objectives: [
          'Host startup pitching competitions and Angel Investor summits',
          'Seed funding guidance with college incubation centre',
          'Startup founder fireside chats and case study sessions'
        ],
        recruitmentStatus: 'Open',
        contactEmail: 'ecell@college.ac.in',
        foundedYear: 2011,
        isActive: true
      },
      {
        name: 'Literary & Debating Society',
        code: 'LDS',
        category: 'Literary & Media',
        tagline: 'The art of eloquent argument, critical discourse, and journalism.',
        description: 'LDS is the intellectual hub of ClubSphere fostering parliamentary debates, model United Nations, creative writing, and campus newsletters.',
        objectives: [
          'Parliamentary and Asian parliamentary debate training',
          'Publish college magazines and student literary journals',
          'Conduct national inter-collegiate debate competitions'
        ],
        recruitmentStatus: 'Coming Soon',
        contactEmail: 'lds@college.ac.in',
        foundedYear: 1975,
        isActive: true
      }
    ];

    const createdClubs = await Club.insertMany(clubsData);
    console.log(`[Seed] Created ${createdClubs.length} college clubs.`);

    // Link Secretary and Faculty users to the Coding Club
    const codingClub = createdClubs[0];
    secretaryUser.club = codingClub._id;
    await secretaryUser.save();

    coreUser.club = codingClub._id;
    await coreUser.save();

    facultyUser.club = codingClub._id;
    await facultyUser.save();

    // 3. Create Recruitment Drives
    const recruitment1 = await Recruitment.create({
      club: codingClub._id,
      title: 'Coding Club Core & Executive Team Recruitment 2026',
      academicYear: '2025-2026',
      roles: [
        {
          roleName: 'Full-Stack Web Developer',
          vacancies: 4,
          description: 'Build web applications for college symposiums and club portals.',
          requirements: 'Experience in Node.js, Express, MongoDB, HTML, CSS, JavaScript.'
        },
        {
          roleName: 'Competitive Programming Lead',
          vacancies: 3,
          description: 'Host weekly contest problems, editorial sessions, and workshops.',
          requirements: 'Active Codeforces / LeetCode profile, strong in DSA (C++/Java/Python).'
        },
        {
          roleName: 'UI/UX & Graphic Designer',
          vacancies: 2,
          description: 'Create event banners, posters, social media media, and UX flows.',
          requirements: 'Figma, Canva, or Photoshop proficiency.'
        }
      ],
      eligibility: 'Open to 1st, 2nd, and 3rd year BE/B.Tech, MCA, and MSc students.',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'Open',
      facultyApproval: {
        status: 'Approved',
        reviewedBy: facultyUser._id,
        remarks: 'Approved by Dr. R. Venkatesh. Excellent initiative for student skill enrichment.',
        reviewedAt: new Date()
      },
      postedBy: secretaryUser._id,
      instructions: 'Please provide valid GitHub/Portfolio links. Shortlisted candidates will be invited for a personal interview.'
    });

    const recruitment2 = await Recruitment.create({
      club: createdClubs[1]._id, // Robotics
      title: 'Robotics Club Project Crew Recruitment 2026',
      academicYear: '2025-2026',
      roles: [
        {
          roleName: 'Embedded Systems Developer',
          vacancies: 3,
          description: 'Program microcontrollers, sensors, and telemetry systems.',
          requirements: 'Hands-on knowledge of Arduino, ESP32, C/C++.'
        },
        {
          roleName: 'Mechanical CAD Designer',
          vacancies: 2,
          description: 'Design 3D chassis, arms, and mechanisms.',
          requirements: 'SolidWorks or Fusion 360 skills.'
        }
      ],
      eligibility: 'All branches welcome, especially Robotics, Mech, EEE, ECE.',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'Open',
      facultyApproval: {
        status: 'Approved',
        remarks: 'Approved.',
        reviewedAt: new Date()
      },
      instructions: 'Candidates will undergo a 1-round technical task followed by discussion.'
    });

    // A pending recruitment drive for Faculty to test viva approval workflow!
    const pendingRecruitment = await Recruitment.create({
      club: codingClub._id,
      title: 'AI/ML Special Interest Group Lead Recruitment',
      academicYear: '2025-2026',
      roles: [
        {
          roleName: 'Machine Learning Research Lead',
          vacancies: 2,
          description: 'Guide student research papers and deep learning workshops.',
          requirements: 'PyTorch/TensorFlow, Python, Computer Vision / NLP.'
        }
      ],
      eligibility: '2nd and 3rd year students with ML project experience.',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Pending Approval',
      facultyApproval: {
        status: 'Pending',
        remarks: 'Pending review by Dr. R. Venkatesh.'
      },
      postedBy: secretaryUser._id
    });

    console.log('[Seed] Created recruitment drives (including 1 pending for viva approval demo).');

    // 4. Create Sample Application by Student
    const sampleApp = await Application.create({
      recruitment: recruitment1._id,
      club: codingClub._id,
      student: studentUser._id,
      appliedRole: 'Full-Stack Web Developer',
      studentName: 'Dharshan R',
      rollNo: '24MX108',
      department: 'Computer Applications',
      year: 1,
      email: 'student@college.ac.in',
      phone: '9842100005',
      cgpa: 8.8,
      skills: 'JavaScript, Node.js, Express, MongoDB, HTML5, CSS3, EJS',
      priorExperience: 'Built Web Applications for college mini-projects and solved DSA problems on LeetCode.',
      whyJoin: 'I am passionate about building practical software solutions and want to actively collaborate with senior developers at ClubSphere Coding Club.',
      portfolioLink: 'https://github.com/college-student',
      status: 'Shortlisted',
      interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      interviewVenue: 'CC Lab 2, F-Block 3rd Floor',
      secretaryNotes: 'Strong profile in Node.js and full stack. Shortlisted for interview.'
    });

    console.log('[Seed] Created sample recruitment application.');

    // 5. Create Events
    const event1 = await Event.create({
      club: codingClub._id,
      title: 'CodeStorm 2026: 24-Hour National Hackathon',
      category: 'Hackathon',
      description: 'The flagship hackathon of ClubSphere where top minds collaborate to solve pressing problems in AI, Healthcare, FinTech, and Smart Campus Automation.',
      venue: 'F-Block Central Computing Facility & Auditorium',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '09:00 AM',
      endTime: '09:00 AM (Next Day)',
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxParticipants: 150,
      status: 'Upcoming',
      participants: [
        {
          student: studentUser._id,
          name: 'Dharshan R',
          rollNo: '24MX108',
          email: 'student@college.ac.in',
          department: 'Computer Applications',
          phone: '9842100005',
          attended: false
        },
        {
          student: coreUser._id,
          name: 'Kavitha M',
          rollNo: '23MX115',
          email: 'core@college.ac.in',
          department: 'Computer Applications',
          phone: '9842100004',
          attended: true
        }
      ],
      createdBy: secretaryUser._id
    });

    const event2 = await Event.create({
      club: codingClub._id,
      title: 'Mastering Full-Stack with Node.js & MongoDB',
      category: 'Workshop',
      description: 'Hands-on practical workshop covering Express routing, MongoDB aggregation, sessions, security, and deploying web applications.',
      venue: 'CC Lab 3, E-Block',
      eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxParticipants: 60,
      status: 'Upcoming',
      participants: [],
      createdBy: secretaryUser._id
    });

    const event3 = await Event.create({
      club: createdClubs[1]._id,
      title: 'Autonomous Mobile Robots Workshop',
      category: 'Workshop',
      description: 'Practical training on ROS2, LIDAR mapping, and path planning on differential drive robots.',
      venue: 'Robotics Center, D-Block Ground Floor',
      eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      registrationDeadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
      maxParticipants: 40,
      status: 'Upcoming',
      participants: [],
      createdBy: facultyUser._id
    });

    console.log('[Seed] Created campus events.');

    // 6. Create Notifications
    await Notification.create([
      {
        recipient: studentUser._id,
        club: codingClub._id,
        title: 'Interview Call: Coding Club Recruitment',
        message: 'Your application for Full-Stack Web Developer has been Shortlisted! Interview is scheduled at CC Lab 2.',
        type: 'application',
        relatedLink: '/student/applications',
        isRead: false
      },
      {
        recipient: null, // broadcast
        club: codingClub._id,
        title: 'Registration Open: CodeStorm 2026',
        message: 'Registrations are now open for our flagship 24-hour hackathon CodeStorm 2026. Register now to reserve seats!',
        type: 'event',
        relatedLink: `/events/${event1._id}`,
        isRead: false
      },
      {
        recipient: facultyUser._id,
        club: codingClub._id,
        title: 'Recruitment Approval Pending',
        message: 'A new recruitment drive "AI/ML Special Interest Group Lead" is waiting for your review and approval.',
        type: 'recruitment',
        relatedLink: '/faculty/dashboard',
        isRead: false
      }
    ]);

    console.log('[Seed] Created initial notifications.');

    console.log('====================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('Demo Credentials for Viva Examination:');
    console.log('1. Student:         student@college.ac.in   / password123');
    console.log('2. Club Secretary:  secretary@college.ac.in / password123');
    console.log('3. Core Member:     core@college.ac.in      / password123');
    console.log('4. Faculty Advisor: faculty@college.ac.in   / password123');
    console.log('5. Admin:           admin@college.ac.in     / password123');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seedDatabase();

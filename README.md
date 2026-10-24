# ClubSphere – Club Discovery & Recruitment Platform

A realistic, full-stack Web Application Development (WAD) project built for **College of Technology**, designed specifically to be clean, modular, practical, and straightforward to demonstrate and defend in your **Viva Examination**.

---

## 🎯 Short Viva Explanation (Pitch to Examiner)

> **"ClubSphere is a centralized platform for college clubs. Students can discover clubs, view recruitment and event details, apply online, and track their applications. Club Secretaries and Core Members manage recruitments and events, Faculty Advisors approve activities, and Admin manages the entire system. The platform solves the problem of scattered club information across WhatsApp, Instagram, and notices by providing a single website for all club-related activities."** ✅

---

## 🛠️ Technology Stack (Syllabus Aligned)

| Layer | Technology | Role in Project |
|---|---|---|
| **Database** | **MongoDB** (with Mongoose ODM) | Stores Users, Clubs, Recruitments, Applications, Events & Notifications |
| **Backend** | **Node.js + Express.js** | Handles MVC routing, session management, bcrypt authentication & business logic |
| **View Engine** | **EJS (Embedded JavaScript)** | Server-side templating for fast, reactive UI rendering without needing React |
| **Frontend** | **HTML5, CSS3, Vanilla JS** | Institutional ClubSphere theme (Navy & Gold), responsive design & modals |

---

## 👥 5 User Roles & Workflows

### 1. Student Module
* Student Registration & Login (with Roll Number and Department)
* Browse & discover all college clubs
* Search clubs by keyword & filter by category (*Technical, Cultural, Sports, Social/NSS, etc.*)
* Apply for open recruitment drives with SOP, skills, and portfolio
* Track application status with a 4-step visual progress bar (*Submitted &rarr; Under Review &rarr; Shortlisted &rarr; Accepted/Rejected*)
* View interview schedule and venue if shortlisted
* One-click RSVP registration for campus events
* Real-time notifications for application updates and event reminders
* Personalized Student Dashboard (Applied clubs, Joined clubs, Saved clubs, Registered events)

### 2. Club Secretary Module
* Secretary Login & Dashboard with applicant analytics
* Manage Club Profile (update tagline, description, objectives, contact info, recruitment status)
* Post recruitment announcements (automatically routes to Faculty Advisor for approval)
* View & filter applicants by role, status, or keyword
* Make decision: **Accept**, **Shortlist** (with interview date/venue schedule), or **Reject**
* Create and manage events (workshops, hackathons, guest lectures)
* Broadcast announcements to all students

### 3. Core Member Module
* Core Member Login & Dashboard
* View registered participants roster for club events
* One-click **attendance check-in** button for event day
* Update event schedules, timings, and campus venues
* Collaborative screening view for recruitment applications

### 4. Faculty Advisor Module
* Faculty Login & Dashboard
* View assigned club activities and event records
* **Approve or Request Revision** on recruitment drives submitted by the Secretary
* Once approved by Faculty, drive is immediately opened to campus students and broadcasted!

### 5. Admin Module (Dean Office)
* Manage all college clubs (Add new club, Edit profile, Delete, Toggle active)
* Manage user accounts and modify permissions (*promote/demote roles between student, secretary, core, faculty, admin*)
* Assign users to specific clubs
* Monitor campus-wide recruitment drives and event participation
* Generate printable / exportable Viva Reports with platform analytics

---

## 📁 Clean MVC Architecture

```
d:\lap\html-css\Projekt\
├── server.js              # Express app initialization & route mounting
├── seed.js                # Database seed script with sample ClubSphere data
├── package.json           # Dependencies and scripts
├── .env                   # Environment config (PORT, MONGO_URI, SESSION_SECRET)
│
├── config/
│   └── db.js              # MongoDB Mongoose connection handler
│
├── models/
│   ├── User.js            # User Schema (Roles, Passwords, Saved Clubs)
│   ├── Club.js            # Club Profile, Objectives, Leadership team
│   ├── Recruitment.js     # Recruitment Drive & Faculty Approval Schema
│   ├── Application.js     # Student Application, Status & Interview details
│   ├── Event.js           # Campus Events, Capacity & Participant Attendance
│   └── Notification.js    # Alerts & Broadcast Announcements
│
├── middleware/
│   └── auth.js            # Session auth & Role-Based Access Control (RBAC)
│
├── routes/
│   ├── authRoutes.js      # /auth (login, register, logout)
│   ├── clubRoutes.js      # /clubs (discovery, details, bookmarking)
│   ├── eventRoutes.js     # /events (browse, RSVP)
│   ├── studentRoutes.js   # /student (dashboard, apply, status, alerts)
│   ├── secretaryRoutes.js # /secretary (profile, recruitments, applicants, events)
│   ├── coreRoutes.js      # /core (attendance check-in, event updates)
│   ├── facultyRoutes.js   # /faculty (review & approve recruitments)
│   └── adminRoutes.js     # /admin (clubs, users, viva reports)
│
├── public/
│   ├── css/
│   │   └── style.css      # ClubSphere institutional styling, responsive CSS
│   └── js/
│       └── main.js        # Modals, alerts, attendance toggle, 1-click test login
│
└── views/
    ├── partials/          # Reusable header, navbar, alerts, footer
    ├── auth/              # login.ejs, register.ejs
    ├── clubs/             # index.ejs, show.ejs
    ├── events/            # index.ejs, show.ejs
    ├── student/           # dashboard.ejs, apply.ejs, applications.ejs, notifications.ejs
    ├── secretary/         # dashboard.ejs, manage-club.ejs, recruitments.ejs, applicants.ejs, events.ejs, create-event.ejs
    ├── core/              # dashboard.ejs, event-participants.ejs, applications.ejs
    ├── faculty/           # dashboard.ejs, recruitments.ejs
    ├── admin/             # dashboard.ejs, clubs.ejs, users.ejs, reports.ejs
    ├── home.ejs           # Landing page
    └── 404.ejs            # Error page
```

---

## ⚡ Quick Demo Accounts for Viva

All accounts use the common demo password: `password123`

| Role | Email | Password | What to Demo |
|---|---|---|---|
| **Student** | `student@college.ac.in` | `password123` | Discover clubs, apply to drive, track status & RSVP event |
| **Club Secretary** | `secretary@college.ac.in` | `password123` | Manage club, review applicants, shortlist with interview date |
| **Core Member** | `core@college.ac.in` | `password123` | Check-in event participants attendance & update venue |
| **Faculty Advisor** | `faculty@college.ac.in` | `password123` | Review and approve pending recruitment drives |
| **Admin (Dean)** | `admin@college.ac.in` | `password123` | Add/edit clubs, change user roles & print viva reports |

> 💡 **Tip:** On the Login page (`/auth/login`), there are 1-click buttons to instantly autofill any of these 5 accounts!

---

## 🚀 How to Run the Project

### 1. Start MongoDB
Ensure MongoDB service is running (it runs automatically on `localhost:27017`).

### 2. Seed Sample ClubSphere Data
Populate realistic clubs (Coding Club, Robotics, Rotaract, Dramatix, etc.) and accounts:
```bash
npm run seed
```

### 3. Start Application
```bash
npm start
```
Visit: **`http://localhost:3000`**

---

## 🎓 Viva Questions & Answers (Frequently Asked)

**Q1: Why did you choose EJS instead of React or Angular?**  
> *"Our WAD syllabus focuses on core server-side web architecture. EJS allows straightforward server-side rendering (SSR), cleaner routing with Express, and avoids the unnecessary complexity of client-side build tools, making the application easy to explain and maintain."*

**Q2: How is Authentication and Role-Based Access Control (RBAC) implemented?**  
> *"Authentication uses `express-session` with passwords securely hashed via `bcryptjs`. RBAC is implemented using a custom middleware `authorizeRoles('secretary', 'admin')` that inspects `req.session.user.role` before granting access to protected routes."*

**Q3: How does the Faculty Approval workflow operate?**  
> *"When a Club Secretary submits a new recruitment drive, its status is set to `Pending Approval`. The Faculty Advisor receives a notification and reviews it on their portal. Only upon Faculty Approval does the drive change to `Open`, becoming visible to all students on campus."*

**Q4: How are relations handled in MongoDB?**  
> *"MongoDB documents reference each other via `mongoose.Schema.Types.ObjectId` with `.populate()`. For instance, an `Application` references both the `Recruitment` drive and the `User` (student), allowing normalized relational queries in a NoSQL database."*

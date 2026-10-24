// ClubSphere Client-Side Scripts

document.addEventListener('DOMContentLoaded', () => {
  // 0. Theme Switcher (Light / Dark Mode)
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;

  function updateThemeUI(theme) {
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    if (themeToggle) {
      themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    }
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeUI(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const targetTheme = active === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('clubsphere-theme', targetTheme);
      updateThemeUI(targetTheme);
    });
  }

  // 1. Mobile Menu Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // 2. Auto Dismiss Flash Alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 400);
    }, 5000);
  });

  // 3. Modal Functionality
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  };

  // Close modal when clicking outside box
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // 4. Quick Login Fill for Viva Demonstration
  window.fillLogin = function (email, pass) {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (emailInput && passInput) {
      emailInput.value = email;
      passInput.value = pass;
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam) {
    const demoAccounts = {
      student: 'student@college.ac.in',
      secretary: 'secretary@college.ac.in',
      core: 'core@college.ac.in',
      faculty: 'faculty@college.ac.in',
      admin: 'admin@college.ac.in'
    };
    if (demoAccounts[roleParam]) {
      window.fillLogin(demoAccounts[roleParam], 'password123');
    }
  }

  // 5. Mark Notification As Read (Ajax)
  window.markAsRead = async function (notifId, el) {
    try {
      const res = await fetch(`/student/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && el) {
        el.closest('.notif-card').classList.add('read');
        const badge = el.querySelector('.notif-status');
        if (badge) badge.remove();
        el.remove();
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // 6. Attendance Toggle (Ajax for Core Member)
  window.toggleAttendance = async function (eventId, participantId, btn) {
    try {
      const res = await fetch(`/core/events/${eventId}/attendance/${participantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.attended) {
          btn.className = 'btn btn-sm btn-success';
          btn.innerHTML = '✓ Present';
        } else {
          btn.className = 'btn btn-sm btn-outline';
          btn.innerHTML = 'Mark Present';
        }
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
    }
  };
});

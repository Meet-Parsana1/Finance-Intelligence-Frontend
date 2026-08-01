/* ===============================
      AUTHENTICATION UTILITIES
      Finance Intelligence
================================ */

function getStoredAuthValue(key) {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
}

/* ===============================
      GET CURRENT USER
================================ */

function getCurrentUser() {
      const user = getStoredAuthValue('currentUser');

      if (!user) return null;

      try {
            return JSON.parse(user);
      } catch (error) {
            return null;
      }
}

/* ===============================
      DASHBOARD PROTECTION
================================ */

function protectDashboard() {
      const token = getStoredAuthValue('token');
      const user = getCurrentUser();

      if (!token || !user) {
            window.location.href = 'login.html';
      }
}

/* ===============================
      REDIRECT IF LOGGED IN
      (Used on login/signup pages)
================================ */

function redirectIfLoggedIn() {
      const token = getStoredAuthValue('token');

      if (token) {
            window.location.href = 'dashboard.html';
      }
}

/* ===============================
      LOGOUT
================================ */

function logoutUser() {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');

      window.location.href = 'login.html';
}

/* ===============================
      ROLE THEME HANDLER
================================ */

function applyRoleTheme() {
      const user = getCurrentUser();

      if (!user || !user.role) return;

      document.body.classList.remove('theme-student', 'theme-salaried', 'theme-msme');

      document.body.classList.add(`theme-${user.role}`);
}

/* ===============================
      AUTO INIT
================================ */

document.addEventListener('DOMContentLoaded', () => {
      applyRoleTheme();
});

const toggleBtn = document.getElementById('theme-toggle') || document.getElementById('themeToggle');

function getThemeIconMarkup(theme) {
      if (theme === 'dark') {
            return `
                  <span class="theme-icon-wrap" aria-hidden="true">
                        <svg class="theme-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="4.2"></circle>
                              <path d="M12 2.5v2.1"></path>
                              <path d="M12 19.4v2.1"></path>
                              <path d="M4.9 4.9l1.5 1.5"></path>
                              <path d="M17.6 17.6l1.5 1.5"></path>
                              <path d="M2.5 12h2.1"></path>
                              <path d="M19.4 12h2.1"></path>
                              <path d="M4.9 19.1l1.5-1.5"></path>
                              <path d="M17.6 6.4l1.5-1.5"></path>
                        </svg>
                  </span>
            `;
      }

      return `
            <span class="theme-icon-wrap" aria-hidden="true">
                  <svg class="theme-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.2 14.2A8.5 8.5 0 1 1 9.8 3.8a6.8 6.8 0 0 0 10.4 10.4Z"></path>
                  </svg>
            </span>
      `;
}

function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);

      if (toggleBtn) {
            toggleBtn.innerHTML = getThemeIconMarkup(theme);
            toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            toggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
}

document.addEventListener('DOMContentLoaded', () => {
      const savedTheme = localStorage.getItem('theme') || 'light';
      applyTheme(savedTheme);
});

if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';

            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
      });
}

window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.glass-navbar');
      if (!navbar) return;

      if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
      } else {
            navbar.classList.remove('scrolled');
      }
});

document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            item.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      item.addEventListener('mouseleave', () => {
            item.style.transform = 'translate(0, 0)';
      });
});

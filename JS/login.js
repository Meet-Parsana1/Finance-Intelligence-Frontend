(function () {
      'use strict';

      /* ===============================
      PASSWORD VISIBILITY TOGGLE
      ================================ */

      function initPasswordToggle() {
            const toggleBtn = document.getElementById('togglePwd');
            const pwdInput = document.getElementById('password');
            const eyeShow = document.getElementById('eyeShow');
            const eyeHide = document.getElementById('eyeHide');

            if (!toggleBtn || !pwdInput) return;

            toggleBtn.addEventListener('click', () => {
                  const isVisible = pwdInput.type === 'text';

                  pwdInput.type = isVisible ? 'password' : 'text';

                  if (eyeShow && eyeHide) {
                        eyeShow.style.display = isVisible ? 'block' : 'none';
                        eyeHide.style.display = isVisible ? 'none' : 'block';
                  }
            });
      }

      /* ===============================
            FORM VALIDATION
      ================================ */

      function setFieldState(groupId, state, icon, msgEl, message) {
            const group = document.getElementById(groupId);
            if (!group) return;

            group.classList.remove('is-valid', 'is-error', 'is-neutral');

            if (state) {
                  group.classList.add('is-' + state);
            }

            if (icon) {
                  icon.textContent = state === 'valid' ? '✓' : state === 'error' ? '✕' : '';
            }

            if (msgEl) {
                  msgEl.textContent = message || '';
            }
      }

      function initLoginValidation() {
            const email = document.getElementById('email');
            const password = document.getElementById('password');

            const emailMsg = document.getElementById('emailMsg');
            const passwordMsg = document.getElementById('passwordMsg');

            const emailIcon = document.getElementById('emailIcon');

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            /* EMAIL VALIDATION */

            email.addEventListener('input', () => {
                  const value = email.value.trim();

                  if (value === '') {
                        setFieldState('fg-email', null, emailIcon, emailMsg, '');

                        return;
                  }

                  if (!emailRegex.test(value)) {
                        setFieldState('fg-email', 'error', emailIcon, emailMsg, 'Please enter a valid email address');
                  } else {
                        setFieldState('fg-email', 'valid', emailIcon, emailMsg, 'Email looks good');
                  }
            });

            /* PASSWORD VALIDATION */

            password.addEventListener('input', () => {
                  const value = password.value;

                  if (value.length === 0) {
                        setFieldState('fg-password', null, null, passwordMsg, '');
                  } else if (value.length < 8) {
                        setFieldState('fg-password', 'error', null, passwordMsg, 'Minimum 8 characters required');
                  } else {
                        setFieldState('fg-password', 'valid', null, passwordMsg, 'Strong password');
                  }
            });
      }

      function showError(message) {
            const existing = document.getElementById('form-error');
            if (existing) existing.remove();

            const err = document.createElement('p');
            err.id = 'form-error';
            err.textContent = message;

            err.style.cssText = `
                  color:#ef4444;
                  font-size:12px;
                  margin-top:8px;
                  `;

            const btn = document.querySelector('.btn-login');

            if (btn) btn.before(err);
      }

      function removeError() {
            const existing = document.getElementById('form-error');
            if (existing) {
                  existing.style.opacity = '0';
                  setTimeout(() => existing.remove(), 200);
            }
      }

      function initPasswordStrength() {
            const passwordInput = document.getElementById('password');
            const strengthBar = document.getElementById('strengthBar');
            const strengthText = document.getElementById('strengthText');

            if (!passwordInput || !strengthBar) return;

            passwordInput.addEventListener('input', () => {
                  const password = passwordInput.value;

                  let score = 0;

                  if (password.length >= 8) score++;
                  if (/[A-Z]/.test(password)) score++;
                  if (/[0-9]/.test(password)) score++;
                  if (/[^A-Za-z0-9]/.test(password)) score++;

                  const levels = [
                        { width: '25%', color: '#ef4444', text: 'Weak password' },
                        { width: '50%', color: '#f59e0b', text: 'Medium password' },
                        { width: '75%', color: '#3b82f6', text: 'Strong password' },
                        { width: '100%', color: '#22c55e', text: 'Very strong password' },
                  ];

                  if (score === 0) {
                        strengthBar.style.width = '0%';
                        strengthText.textContent = '';
                        return;
                  }

                  const level = levels[score - 1];

                  strengthBar.style.width = level.width;
                  strengthBar.style.background = level.color;
                  strengthText.textContent = level.text;
            });
      }

      /* ===============================
            INITIALISE
      ================================ */

      function init() {
            initPasswordToggle();
            initLoginValidation();
      }

      if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
      } else {
            init();
      }
})();

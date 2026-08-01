/**
      signup.js
      Finance Intelligence — Signup Form Logic

      Responsibilities:
            1. Real-time field validation (name, email, password, confirm, role)
            2. Password visibility toggle
            3. Password strength meter
            4. Form submission handler (extensible API hook)
 */

(function () {
      'use strict';

      /* ── DOM refs ──────────────────────────────────────────── */
      const form = document.getElementById('signupForm');
      const submitBtn = document.getElementById('submitBtn');

      // Fields
      const fullNameEl = document.getElementById('fullName');
      const emailEl = document.getElementById('email');
      const passwordEl = document.getElementById('password');
      const confirmEl = document.getElementById('confirmPassword');
      const accountTypeEl = document.getElementById('accountType');

      // Icons & messages
      const nameIcon = document.getElementById('nameIcon');
      const nameMsg = document.getElementById('nameMsg');
      const emailIcon = document.getElementById('emailIcon');
      const emailMsg = document.getElementById('emailMsg');
      const confirmIcon = document.getElementById('confirmIcon');
      const confirmMsg = document.getElementById('confirmMsg');

      // Strength meter
      const strengthMeter = document.getElementById('strengthMeter');
      const strengthBar = document.getElementById('strengthBar');
      const strengthLabel = document.getElementById('strengthLabel');

      // Password toggle
      const togglePwdBtn = document.getElementById('togglePwd');
      const eyeShow = document.getElementById('eyeShow');
      const eyeHide = document.getElementById('eyeHide');

      /* ── Validation state map ──────────────────────────────── */
      // Tracks which fields currently pass; submit is only enabled when all true.
      const valid = {
            name: false,
            email: false,
            password: false,
            confirm: false,
            role: false,
      };

      /* ══════════════════════════════════════════════════════════
            1. HELPER UTILITIES
      ══════════════════════════════════════════════════════════ */

      /** Apply valid / error / neutral visual state to a .form-group */
      function setFieldState(groupId, state, icon, msgEl, message) {
            const group = document.getElementById(groupId);
            if (!group) return;

            group.classList.remove('is-valid', 'is-error', 'is-neutral');
            if (state) group.classList.add('is-' + state);

            if (icon) icon.textContent = state === 'valid' ? '✓' : state === 'error' ? '✕' : '';
            if (msgEl) msgEl.textContent = message ?? '';
      }

      /** Recalculate whether the submit button should be enabled */
      function syncSubmitState() {
            const allValid = Object.values(valid).every(Boolean);
            submitBtn.disabled = !allValid;
      }

      /** Simple email regex */
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      /* ══════════════════════════════════════════════════════════
            2. FIELD VALIDATORS
      ══════════════════════════════════════════════════════════ */

      /* ── Full Name ──────────────────────────────────────────── */
      function validateName(showFeedback) {
            const val = fullNameEl.value.trim();

            if (!showFeedback && val === '') {
                  // User hasn't touched this yet — don't show error
                  setFieldState('fg-name', null, nameIcon, nameMsg, '');
                  valid.name = false;
            } else if (val.length < 3) {
                  setFieldState('fg-name', 'error', nameIcon, nameMsg, 'Minimum 3 characters required.');
                  valid.name = false;
            } else {
                  setFieldState('fg-name', 'valid', nameIcon, nameMsg, 'Looks good!');
                  valid.name = true;
            }

            syncSubmitState();
      }

      /* ── Email ──────────────────────────────────────────────── */
      function validateEmail(showFeedback) {
            const val = emailEl.value.trim();

            if (!showFeedback && val === '') {
                  setFieldState('fg-email', null, emailIcon, emailMsg, '');
                  valid.email = false;
            } else if (!EMAIL_RE.test(val)) {
                  setFieldState('fg-email', 'error', emailIcon, emailMsg, 'Please enter a valid email address.');
                  valid.email = false;
            } else {
                  setFieldState('fg-email', 'valid', emailIcon, emailMsg, 'Email looks good.');
                  valid.email = true;
            }

            syncSubmitState();
      }

      /* ── Password + Strength Meter ──────────────────────────── */

      /**
       * Score a password: returns 0 (weak), 1 (medium), 2 (strong)
       * Criteria:
       *   - length ≥ 8
       *   - contains uppercase
       *   - contains lowercase
       *   - contains digit
       *   - contains special character
       */
      function scorePassword(pwd) {
            if (pwd.length === 0) return -1;

            let score = 0;
            if (pwd.length >= 8) score++;
            if (/[A-Z]/.test(pwd)) score++;
            if (/[a-z]/.test(pwd)) score++;
            if (/[0-9]/.test(pwd)) score++;
            if (/[^A-Za-z0-9]/.test(pwd)) score++;

            if (score <= 2) return 0; // weak
            if (score <= 3) return 1; // medium
            return 2; // strong
      }

      function updateStrengthMeter(pwd) {
            if (pwd.length === 0) {
                  strengthMeter.classList.remove('visible');
                  strengthBar.removeAttribute('data-strength');
                  strengthLabel.removeAttribute('data-strength');
                  strengthLabel.textContent = '';
                  return;
            }

            strengthMeter.classList.add('visible');

            const score = scorePassword(pwd);
            const levels = ['weak', 'medium', 'strong'];
            const labels = ['Weak', 'Medium', 'Strong'];
            const level = levels[score];

            strengthBar.setAttribute('data-strength', level);
            strengthLabel.setAttribute('data-strength', level);
            strengthLabel.textContent = labels[score];
      }

      function validatePassword() {
            const val = passwordEl.value;
            updateStrengthMeter(val);

            if (val.length === 0) {
                  valid.password = false;
            } else if (val.length < 8) {
                  valid.password = false;
            } else {
                  valid.password = true;
            }

            // Re-check confirm field whenever password changes
            if (confirmEl.value.length > 0) validateConfirm();

            syncSubmitState();
      }

      /* ── Confirm Password ───────────────────────────────────── */
      function validateConfirm() {
            const pwd = passwordEl.value;
            const confirm = confirmEl.value;

            if (confirm.length === 0) {
                  setFieldState('fg-confirm', null, confirmIcon, confirmMsg, '');
                  valid.confirm = false;
            } else if (confirm !== pwd) {
                  setFieldState('fg-confirm', 'error', confirmIcon, confirmMsg, 'Passwords do not match ✖');
                  valid.confirm = false;
            } else {
                  setFieldState('fg-confirm', 'valid', confirmIcon, confirmMsg, 'Passwords match ✓');
                  valid.confirm = true;
            }

            syncSubmitState();
      }

      /* ── Account Type ───────────────────────────────────────── */
      function validateRole() {
            valid.role = accountTypeEl.value !== '';
            syncSubmitState();
      }

      /* ══════════════════════════════════════════════════════════
            3. EVENT LISTENERS
      ══════════════════════════════════════════════════════════ */
      /* Name — validate on blur (first touch) and on every subsequent input */
      fullNameEl.addEventListener('blur', () => validateName(true));
      fullNameEl.addEventListener('input', () => {
            if (fullNameEl.dataset.touched) validateName(true);
      });
      fullNameEl.addEventListener(
            'blur',
            () => {
                  fullNameEl.dataset.touched = '1';
            },
            { once: true },
      );

      /* Email */
      emailEl.addEventListener('blur', () => validateEmail(true));
      emailEl.addEventListener('input', () => {
            if (emailEl.dataset.touched) validateEmail(true);
      });
      emailEl.addEventListener(
            'blur',
            () => {
                  emailEl.dataset.touched = '1';
            },
            { once: true },
      );

      /* Password — live feedback so the strength bar responds immediately */
      passwordEl.addEventListener('input', validatePassword);

      /* Confirm password */
      confirmEl.addEventListener('input', validateConfirm);
      confirmEl.addEventListener('blur', validateConfirm);

      /* Account type */
      accountTypeEl.addEventListener('change', validateRole);

      /* ══════════════════════════════════════════════════════════
            4. PASSWORD VISIBILITY TOGGLE
      ══════════════════════════════════════════════════════════ */
      togglePwdBtn.addEventListener('click', () => {
            const visible = passwordEl.type === 'text';
            passwordEl.type = visible ? 'password' : 'text';

            eyeShow.style.display = visible ? 'block' : 'none';
            eyeHide.style.display = visible ? 'none' : 'block';

            togglePwdBtn.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
      });

      /* ══════════════════════════════════════════════════════════
            5. FORM SUBMISSION
      ══════════════════════════════════════════════════════════ */
      form.addEventListener('submit', (e) => {
            e.preventDefault();

            /* Run all validators one final time in case fields were auto-filled */
            validateName(true);
            validateEmail(true);
            validatePassword();
            validateConfirm();
            validateRole();

            if (!Object.values(valid).every(Boolean)) return;

            const payload = {
                  name: fullNameEl.value.trim(),
                  email: emailEl.value.trim(),
                  password: passwordEl.value,
                  accountType: accountTypeEl.value,
            };

            /* Visual loading state */
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account…';

            // Real API Call
            fetch('http://localhost:5000/api/auth/register', {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
            })
                  .then((res) => res.json())
                  .then((data) => {
                        if (data.message === 'User registered successfully') {
                              alert('Account created successfully!');
                              window.location.href = 'login.html';
                        } else {
                              alert(data.message);
                        }
                  })
                  .catch((err) => {
                        console.error(err);
                        alert('Server error. Please try again.');
                  })
                  .finally(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Create Account';
                  });
      });

      /* ══════════════════════════════════════════════════════════
            6. INIT — run once on load to ensure correct initial state
      ══════════════════════════════════════════════════════════ */
      function init() {
            syncSubmitState(); // button starts disabled
      }

      if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
      } else {
            init();
      }
})();

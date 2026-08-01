(function () {
      const form = document.getElementById('resetPasswordForm');
      const passwordInput = document.getElementById('newPassword');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const messageEl = document.getElementById('resetPasswordMessage');
      const submitButton = form?.querySelector('button[type="submit"]');
      const token = new URLSearchParams(window.location.search).get('token');

      if (!form || !passwordInput || !confirmPasswordInput || !messageEl) return;

      const setMessage = (type, text) => {
            messageEl.className = type ? `recovery-message ${type}` : 'recovery-message';
            messageEl.textContent = text;
      };

      if (!token) {
            setMessage('is-error', 'This password reset link is missing or invalid. Please request a new one.');
            passwordInput.disabled = true;
            confirmPasswordInput.disabled = true;
            if (submitButton) submitButton.disabled = true;
            return;
      }

      form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (password.length < 8) {
                  setMessage('is-error', 'Your new password must be at least 8 characters long.');
                  return;
            }

            if (password !== confirmPassword) {
                  setMessage('is-error', 'Password confirmation does not match.');
                  return;
            }

            setMessage('', 'Securing your new password...');

            if (submitButton) {
                  submitButton.disabled = true;
                  submitButton.textContent = 'Resetting...';
            }

            try {
                  const response = await fetch('https://finance-intelligence-q3zx.onrender.com/api/auth/reset-password', {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                              token,
                              password,
                        }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                        throw new Error(data.message || 'Unable to reset your password right now.');
                  }

                  setMessage('is-success', `${data.message} Redirecting to login...`);

                  setTimeout(() => {
                        window.location.href = 'login.html';
                  }, 1400);
            } catch (error) {
                  setMessage('is-error', error.message || 'Something went wrong. Please try again.');
            } finally {
                  if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Reset Password';
                  }
            }
      });
})();

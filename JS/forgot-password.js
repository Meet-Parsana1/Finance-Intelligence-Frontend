(function () {
      const form = document.getElementById('forgotPasswordForm');
      const emailInput = document.getElementById('recoveryEmail');
      const messageEl = document.getElementById('forgotPasswordMessage');
      const submitButton = form?.querySelector('button[type="submit"]');

      if (!form || !emailInput || !messageEl) return;

      form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const clientOrigin = `${window.location.origin}/Frontend`;

            if (!email) {
                  messageEl.className = 'recovery-message is-error';
                  messageEl.textContent = 'Please enter the email address linked to your account.';
                  return;
            }

            messageEl.className = 'recovery-message';
            messageEl.textContent = 'Generating your secure reset link...';
            if (submitButton) {
                  submitButton.disabled = true;
                  submitButton.textContent = 'Generating...';
            }

            try {
                  const response = await fetch('https://finance-intelligence-q3zx.onrender.com/api/auth/forgot-password', {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                              email,
                              clientOrigin,
                        }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                        throw new Error(data.message || 'Unable to generate reset link right now.');
                  }

                  messageEl.className = 'recovery-message is-success';
                  messageEl.textContent = data.message;

                  if (data.resetUrl) {
                        messageEl.textContent = `${data.message} Redirecting you to the secure reset screen...`;
                        setTimeout(() => {
                              window.location.href = data.resetUrl;
                        }, 1200);
                  } else {
                        messageEl.textContent =
                              'If this email is registered with Finance Intelligence, a secure reset link has been prepared. If you do not receive access to a reset screen, please verify that you entered the same email used during account creation.';
                  }
            } catch (error) {
                  messageEl.className = 'recovery-message is-error';
                  messageEl.textContent = error.message || 'Something went wrong. Please try again.';
            } finally {
                  if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Generate Reset Link';
                  }
            }
      });
})();

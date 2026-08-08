const AUTH_API_URL = 'https://finance-intelligence-q3zx.onrender.com/api/auth/login';

function showLoginError(form, message) {
      document.getElementById('form-error')?.remove();

      const error = document.createElement('p');
      error.id = 'form-error';
      error.setAttribute('role', 'alert');
      error.textContent = message;
      form.append(error);
}

function initialiseLogin() {
      const loginForm = document.getElementById('loginForm');
      const rememberMeCheckbox = document.getElementById('rememberMe');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const submitButton = loginForm?.querySelector('button[type="submit"]');

      if (!loginForm || !emailInput || !passwordInput) {
            console.error('Login form could not be initialised.');
            return;
      }

      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const rememberPreference = localStorage.getItem('rememberLogin') === 'true';
      if (rememberMeCheckbox) rememberMeCheckbox.checked = rememberPreference;
      if (rememberedEmail) emailInput.value = rememberedEmail;

      loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            document.getElementById('form-error')?.remove();

            if (!loginForm.reportValidity()) return;

            const originalLabel = submitButton?.textContent;
            if (submitButton) {
                  submitButton.disabled = true;
                  submitButton.textContent = 'Signing in…';
            }

            try {
                  const response = await fetch(AUTH_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              email: emailInput.value.trim(),
                              password: passwordInput.value,
                        }),
                  });

                  const data = await response.json().catch(() => ({}));
                  if (!response.ok || !data.token || !data.user) {
                        throw new Error(data.message || 'Unable to sign in. Please check your email and password.');
                  }

                  const rememberMe = Boolean(rememberMeCheckbox?.checked);
                  const targetStorage = rememberMe ? localStorage : sessionStorage;
                  const otherStorage = rememberMe ? sessionStorage : localStorage;
                  otherStorage.removeItem('token');
                  otherStorage.removeItem('currentUser');
                  targetStorage.setItem('token', data.token);
                  targetStorage.setItem('currentUser', JSON.stringify(data.user));

                  if (rememberMe) {
                        localStorage.setItem('rememberedEmail', emailInput.value.trim());
                        localStorage.setItem('rememberLogin', 'true');
                  } else {
                        localStorage.removeItem('rememberedEmail');
                        localStorage.setItem('rememberLogin', 'false');
                  }

                  window.location.assign('./dashboard.html');
            } catch (error) {
                  console.error('Login failed:', error);
                  showLoginError(loginForm, error.message || 'Unable to reach the login service. Please try again.');
                  if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalLabel;
                  }
            }
      });
}

if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialiseLogin, { once: true });
} else {
      initialiseLogin();
}

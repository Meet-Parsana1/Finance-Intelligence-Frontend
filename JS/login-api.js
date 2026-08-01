const loginForm = document.getElementById('loginForm');
const rememberMeCheckbox = document.getElementById('rememberMe');
const emailInput = document.getElementById('email');

document.addEventListener('DOMContentLoaded', () => {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const rememberPreference = localStorage.getItem('rememberLogin') === 'true';

      if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = rememberPreference;
      }

      if (emailInput && rememberedEmail) {
            emailInput.value = rememberedEmail;
      }
});

loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const rememberMe = Boolean(rememberMeCheckbox?.checked);

      try {
            const response = await fetch('https://finance-intelligence-q3zx.onrender.com/api/auth/login', {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                        email,
                        password,
                  }),
            });

            const data = await response.json();

            if (data.token) {
                  const targetStorage = rememberMe ? localStorage : sessionStorage;
                  const otherStorage = rememberMe ? sessionStorage : localStorage;

                  otherStorage.removeItem('token');
                  otherStorage.removeItem('currentUser');

                  targetStorage.setItem('token', data.token);
                  targetStorage.setItem('currentUser', JSON.stringify(data.user));

                  if (rememberMe) {
                        localStorage.setItem('rememberedEmail', email);
                        localStorage.setItem('rememberLogin', 'true');
                  } else {
                        localStorage.removeItem('rememberedEmail');
                        localStorage.setItem('rememberLogin', 'false');
                  }

                  window.location.href = 'dashboard.html';
            } else {
                  alert(data.message);
            }
      } catch (error) {
            console.error(error);
            alert('Server error');
      }
});

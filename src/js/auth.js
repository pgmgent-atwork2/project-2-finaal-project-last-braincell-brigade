import { signUp, signIn, signOut } from '../../backend/services/authService.js';

const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');
const logoutBtn = document.getElementById('logout-btn');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await signUp(email, password);
      alert('Registered successfully! Please log in.');
      window.location.href = '/src/views/login.html';
    } catch (err) {
      alert(err.message);
    }
  });
}

if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await signIn(email, password);
      
      alert('Signed in successfully!');
      window.location.href = '/src/views/home.html';
    } catch (err) {
      alert(err.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", function() {
    signOut()
      .then(() => {
        alert('Signed out successfully!');
        window.location.href = '/src/views/login.html';
      })
      .catch((err) => {
        alert(err.message);
      });
  });
}

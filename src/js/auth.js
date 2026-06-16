import { signUp, signIn, signOut } from '../../backend/services/authService.js';
import { supabase } from "../../backend/config/supabaseClient.js";

const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');
const logoutBtn = document.getElementById('logout-btn');
const guestBtn = document.getElementById("guest-order-btn");

if (guestBtn) {
  guestBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem("guest_order_id");

      window.location.href = "/src/views/drinks.html";

    } catch (err) {
      alert(err.message);
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await signUp(email, password, firstName, lastName);
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

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
      await signIn(email, password);
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
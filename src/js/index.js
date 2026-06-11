import { requireAuth } from '../utils/authGuard.js';

async function init() {
  await requireAuth();

  console.log('User is authenticated');
}

init();


const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

menuBtn.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
});

document.getElementById("closeBtn").addEventListener("click", () => {
  sideMenu.classList.remove("open");
});
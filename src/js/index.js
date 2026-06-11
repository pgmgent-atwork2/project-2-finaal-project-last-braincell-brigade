import { requireAuth } from '../utils/authGuard.js';

async function init() {
  await requireAuth();

  console.log('User is authenticated');
}

init();


const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const closeBtn = document.getElementById("closeBtn");

menuBtn?.addEventListener("click", () => {
  sideMenu?.classList.add("open");
});

closeBtn?.addEventListener("click", () => {
  sideMenu?.classList.remove("open");
});

sideMenu?.addEventListener("click", event => {
  if (event.target.matches("a")) {
    sideMenu.classList.remove("open");
  }
});

const items = document.querySelectorAll(".board-item");

items.forEach(item => {
  const button = item.querySelector(".board-role");

  button?.addEventListener("click", () => {
    item.classList.toggle("active");
    button.setAttribute("aria-expanded", item.classList.contains("active"));
  });
});

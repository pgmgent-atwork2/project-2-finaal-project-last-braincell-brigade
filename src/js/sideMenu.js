const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');

menuBtn?.addEventListener('click', () => {
  sideMenu?.classList.add('open');
});

closeBtn?.addEventListener('click', () => {
  sideMenu?.classList.remove('open');
});

sideMenu?.addEventListener('click', event => {
  if (event.target.matches('a')) {
    sideMenu.classList.remove('open');
  }
});

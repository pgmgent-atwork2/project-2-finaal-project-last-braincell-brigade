import { requireAdmin } from '../utils/authGuard.js';

async function init() {
  await requireAdmin();

  const navButtons = document.querySelectorAll('[data-admin-tab]');
  const panels = document.querySelectorAll('[data-admin-panel]');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetPanel = button.dataset.adminTab;

      navButtons.forEach((navButton) => {
        navButton.classList.toggle('active', navButton === button);
      });

      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.adminPanel === targetPanel);
      });
    });
  });

  console.log('Admin access granted');
}

init();

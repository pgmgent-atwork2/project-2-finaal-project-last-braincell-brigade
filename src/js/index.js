import { requireAuth } from '../utils/authGuard.js';

async function init() {
  await requireAuth();

  // If user is logged in, continue loading page
  console.log('User is authenticated');
}

init();
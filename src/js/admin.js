import { requireAdmin } from '../utils/authGuard.js';

async function init() {
  await requireAdmin();
  
  console.log('Admin access granted');
}

init();
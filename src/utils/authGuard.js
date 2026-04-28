import { getCurrentUser } from '../../backend/services/authService.js';

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = '/src/views/login.html';
    return null;
  }

  return user;
}

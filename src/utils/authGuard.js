import { getCurrentUser, getUserProfile } from '../../backend/services/authService.js';

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = '/src/views/login.html';
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return;

  const profile = await getUserProfile(user.id);

  if (profile.role !== 'admin') {
    window.location.href = '/src/views/home.html';
    return null;
  }

  return user;
}
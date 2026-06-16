import { getCurrentUser, getUserProfile } from "../../backend/services/authService.js";

async function showAdminNavigation() {
  const adminLinks = document.querySelectorAll(".admin-only");
  if (!adminLinks.length) return;

  try {
    const user = await getCurrentUser();
    if (!user) return;

    const profile = await getUserProfile(user.id);
    if (profile?.role !== "admin") return;

    adminLinks.forEach((link) => {
      link.classList.add("admin-visible");
      link.removeAttribute("aria-hidden");
    });
  } catch (error) {
    console.error("Could not check admin navigation:", error);
  }
}

showAdminNavigation();

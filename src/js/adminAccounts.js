import { deleteProfile, getAllProfiles, updateProfile } from "../api/users.js";
import { getAllAccountOrders, getAllOpenOrders } from "../api/orders.js";

let profiles = [];
let unpaidOrders = [];
let selectedProfile = null;

const elements = {
  searchInput: document.querySelector("#admin-account-search"),
  searchButton: document.querySelector("#admin-account-search-btn"),
  list: document.querySelector("#admin-account-list"),
  bills: document.querySelector("#admin-account-bills"),
  firstName: document.querySelector("#admin-account-first-name"),
  lastName: document.querySelector("#admin-account-last-name"),
  username: document.querySelector("#admin-account-username"),
  phone: document.querySelector("#admin-account-phone"),
  email: document.querySelector("#admin-account-email"),
  saveButton: document.querySelector("#admin-account-save"),
  reminderButton: document.querySelector("#admin-account-reminder"),
};

function fullName(profile) {
  return `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Naam Familienaam";
}

function formatPrice(value) {
  return `€${Number(value).toFixed(2).replace(".", ",")}`;
}

function orderTotal(order) {
  return (order.order_items || []).reduce((total, item) => {
    return total + Number(item.price_at_order || 0) * Number(item.quantity || 0);
  }, 0);
}

function ordersForProfile(profile) {
  if (!profile) return [];
  return unpaidOrders.filter((order) => order.profile_id === profile.id);
}

function hasOpenBill(profile) {
  return ordersForProfile(profile).length > 0;
}

function renderAccounts(accounts = profiles) {
  if (!elements.list) return;

  if (!accounts.length) {
    elements.list.innerHTML = '<p class="account-empty-state">Geen accounts gevonden.</p>';
    return;
  }

  elements.list.innerHTML = accounts.map((profile) => `
    <article class="admin-account-row ${selectedProfile?.id === profile.id ? "active" : ""}" data-account-id="${profile.id}">
      <button class="account-row-main" type="button">
        <span class="account-avatar" aria-hidden="true"></span>
        <span>${fullName(profile)}</span>
        ${hasOpenBill(profile) ? '<span class="bill-badge">open rekening</span>' : ""}
      </button>
      <button class="account-remove-btn" type="button" data-remove-account="${profile.id}">Account verwijderen</button>
    </article>
  `).join("");

  elements.list.querySelectorAll("[data-account-id] .account-row-main").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("[data-account-id]");
      selectProfile(profiles.find((profile) => profile.id === row.dataset.accountId));
    });
  });

  elements.list.querySelectorAll("[data-remove-account]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const profile = profiles.find((item) => item.id === button.dataset.removeAccount);
      if (!profile) return;

      const confirmed = window.confirm(`Account "${fullName(profile)}" verwijderen?`);
      if (!confirmed) return;

      const deleted = await deleteProfile(profile.id);
      if (!deleted) {
        alert("Account verwijderen is niet gelukt.");
        return;
      }

      profiles = profiles.filter((item) => item.id !== profile.id);
      selectProfile(profiles[0] ?? null);
      applySearch();
    });
  });
}

function renderBills() {
  if (!elements.bills) return;

  const orders = ordersForProfile(selectedProfile);

  if (!orders.length) {
    elements.bills.innerHTML = '<p class="account-empty-state">Geen openstaande rekening.</p>';
    return;
  }

  elements.bills.innerHTML = orders.map((order) => {
    const total = orderTotal(order);
    const itemCount = (order.order_items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return `
      <article class="account-bill-row">
        <span>ORD-${order.id}</span>
        <span>${order.status === "account" ? "Op rekening" : "Open mandje"}</span>
        <strong>${itemCount} items · ${formatPrice(total)}</strong>
      </article>
    `;
  }).join("");
}

function selectProfile(profile) {
  selectedProfile = profile ?? null;

  if (elements.firstName) elements.firstName.value = selectedProfile?.first_name || "";
  if (elements.lastName) elements.lastName.value = selectedProfile?.last_name || "";
  if (elements.username) elements.username.value = selectedProfile?.username || "";
  if (elements.phone) elements.phone.value = selectedProfile?.phone || selectedProfile?.phone_number || selectedProfile?.telephone || "";
  if (elements.email) elements.email.value = selectedProfile?.email || "";

  renderAccounts();
  renderBills();
}

function applySearch() {
  const query = elements.searchInput?.value.trim().toLowerCase() || "";

  if (!query) {
    renderAccounts();
    return;
  }

  renderAccounts(profiles.filter((profile) => {
    const haystack = [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.username,
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  }));
}

async function saveSelectedProfile() {
  if (!selectedProfile) {
    alert("Selecteer eerst een account.");
    return;
  }

  const updates = {
    first_name: elements.firstName?.value.trim() || "",
    last_name: elements.lastName?.value.trim() || "",
    email: elements.email?.value.trim() || "",
  };

  if ("username" in selectedProfile) updates.username = elements.username?.value.trim() || "";
  if ("phone" in selectedProfile) updates.phone = elements.phone?.value.trim() || "";

  elements.saveButton.disabled = true;
  elements.saveButton.textContent = "Opslaan...";

  const updated = await updateProfile(selectedProfile.id, updates);

  elements.saveButton.disabled = false;
  elements.saveButton.textContent = "Account bijwerken";

  if (!updated) {
    alert("Account bijwerken is niet gelukt.");
    return;
  }

  profiles = profiles.map((profile) => profile.id === updated.id ? updated : profile);
  selectProfile(updated);
}

function sendReminder() {
  if (!selectedProfile) {
    alert("Selecteer eerst een account.");
    return;
  }

  const orders = ordersForProfile(selectedProfile);
  if (!orders.length) {
    alert(`${fullName(selectedProfile)} heeft geen openstaande rekening.`);
    return;
  }

  const total = orders.reduce((sum, order) => sum + orderTotal(order), 0);
  alert(`Herinnering klaar voor ${fullName(selectedProfile)}: openstaand bedrag ${formatPrice(total)}.`);
}

async function initAccountAdmin() {
  if (!elements.list) return;

  const [profileRows, openOrders, accountOrders] = await Promise.all([
    getAllProfiles().catch(() => []),
    getAllOpenOrders(),
    getAllAccountOrders(),
  ]);

  profiles = profileRows ?? [];
  unpaidOrders = [...(openOrders ?? []), ...(accountOrders ?? [])];

  elements.searchButton?.addEventListener("click", applySearch);
  elements.searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applySearch();
  });
  elements.saveButton?.addEventListener("click", saveSelectedProfile);
  elements.reminderButton?.addEventListener("click", sendReminder);

  selectProfile(profiles[0] ?? null);
}

initAccountAdmin();

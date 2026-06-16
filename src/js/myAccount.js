import { supabase } from "../../backend/config/supabaseClient.js";
import { getAccountOrders, startGuestPayment, closeOrder } from "../api/orders.js";

const accountForm = document.querySelector("#account-form");
const usernameLabel = document.querySelector("[data-account-username]");
const billList = document.querySelector("[data-account-bill-list]");
const historyList = document.querySelector("[data-account-history]");
const totalLabel = document.querySelector("[data-account-total]");
const payButton = document.querySelector("[data-pay-account-bill]");
const logoutButton = document.querySelector("#logout-btn");

let currentUser = null;
let currentProfile = null;
let accountOrders = [];
let accountTotal = 0;
let currentPhone = "";

function formatPrice(price) {
  return `€${Number(price).toFixed(2).replace(".", ",")}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function maskPhone(value) {
  const phone = String(value || "").trim();
  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) return phone || "";

  return `${digits.slice(0, 2)}${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-2)}`;
}

function setInput(name, value) {
  const input = accountForm?.elements[name];
  if (input) input.value = value || "";
}

function fillAccountForm(profile, user) {
  currentPhone = profile?.phone || profile?.phone_number || profile?.telephone || "";

  setInput("last_name", profile?.last_name);
  setInput("first_name", profile?.first_name);
  setInput("username", profile?.username || user?.email?.split("@")[0]);
  setInput("phone", maskPhone(currentPhone));
  setInput("email", user?.email);
  setInput("password", "****");

  if (usernameLabel) {
    usernameLabel.textContent = profile?.username
      || profile?.first_name
      || user?.email?.split("@")[0]
      || "Mijn account";
  }
}

async function loadProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("loadProfile error:", error);
    return null;
  }

  return data;
}

async function saveProfile(event) {
  event.preventDefault();
}

function renderBill(orders) {
  const items = orders.flatMap(order => {
    return order.order_items.map(item => ({
      ...item,
      orderDate: order.updated_at || order.created_at,
    }));
  });

  accountTotal = items.reduce((sum, item) => {
    return sum + Number(item.price_at_order) * item.quantity;
  }, 0);

  if (totalLabel) totalLabel.textContent = formatPrice(accountTotal);
  if (payButton) payButton.disabled = accountTotal <= 0;

  if (!billList) return;

  if (items.length === 0) {
    billList.innerHTML = `
      <div class="account-empty-state">
        <img src="../assets/images/logout-paddles.png" alt="">
        <p>Je hebt geen openstaande rekening.</p>
      </div>
    `;
    return;
  }

  billList.innerHTML = items.map(item => {
    const name = item.drinks?.name || "Drankje";
    const image = item.drinks?.image_url;
    const price = Number(item.price_at_order) * item.quantity;

    return `
      <article class="bill-row">
        <span class="bill-amount">${item.quantity}</span>
        ${image
          ? `<img class="bill-drink-image" src="${escapeHtml(image)}" alt="${escapeHtml(name)}">`
          : '<span class="drink-image" aria-hidden="true"></span>'}
        <span class="drink-name">${escapeHtml(name)}</span>
        <span class="drink-price">${formatPrice(price)}</span>
      </article>
    `;
  }).join("");
}

function renderHistory(orders) {
  if (!historyList) return;

  if (orders.length === 0) {
    historyList.innerHTML = `
      <li class="history-empty-state">
        <img src="../assets/images/logout-paddles.png" alt="">
        <span>Nog geen bestelgeschiedenis.</span>
      </li>
    `;
    return;
  }

  historyList.innerHTML = orders.map(order => {
    const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const date = order.updated_at || order.created_at;

    return `
      <li>
        <time datetime="${escapeHtml(date)}">${formatDate(date)}</time>: ${itemCount} items
      </li>
    `;
  }).join("");
}

async function payAccountBill() {
  if (accountOrders.length === 0 || accountTotal <= 0) return;

  const orderIds = accountOrders.map(order => order.id);
  const firstOrderId = orderIds[0];

  try {
    await Promise.all(orderIds.map(id => closeOrder(id)));

    await startGuestPayment(
      firstOrderId,
      accountTotal.toFixed(2),
      `HNO Assenede rekening ${currentUser.id}`,
      orderIds
    );
  } catch (error) {
    console.error("account payment error:", error);
    alert("De betaling kon niet gestart worden. Probeer opnieuw.");
  }
}

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("Uitloggen is niet gelukt.");
    console.error("logout error:", error);
    return;
  }

  window.location.href = "/src/views/login.html";
}

async function initAccount() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/src/views/login.html";
    return;
  }

  currentUser = user;
  currentProfile = await loadProfile(user);
  fillAccountForm(currentProfile, user);

  accountOrders = await getAccountOrders();
  renderBill(accountOrders);
  renderHistory(accountOrders);
}

accountForm?.addEventListener("submit", saveProfile);
payButton?.addEventListener("click", payAccountBill);
logoutButton?.addEventListener("click", logout);

initAccount();
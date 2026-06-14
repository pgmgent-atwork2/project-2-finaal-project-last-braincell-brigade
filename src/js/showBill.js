import { getOrderItems, removeOrderItem, closeOrder, putOrderOnAccount, startGuestPayment } from "../api/orders.js";
import { supabase } from "../../backend/config/supabaseClient.js";

function formatPrice(price) {
  return `€${Number(price).toFixed(2).replace('.', ',')}`;
}

export async function refreshBill(orderId) {
  const items = await getOrderItems(orderId);
  const bill = document.querySelector('.bill');
  if (!bill) return;

  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.price_at_order) * item.quantity;
  }, 0);

  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = !user;

  bill.innerHTML = `
    <h2 class="bill-title">Your bill</h2>
    ${items.length === 0
      ? '<p class="bill-empty">Nog niks in je mandje...</p>'
      : `<ul class="bill-items">
          ${items.map(item => `
            <li class="bill-item" data-item-id="${item.id}">
              <span class="bill-item-qty">${item.quantity}</span>
              <img class="bill-item-image" src="${item.drinks.image_url}" alt="${item.drinks.name}">
              <span class="bill-item-name">${item.drinks.name}</span>
              <span class="bill-item-price">${formatPrice(parseFloat(item.price_at_order) * item.quantity)}</span>
              <button class="bill-item-remove" type="button" aria-label="Remove ${item.drinks.name}">×</button>
            </li>
          `).join('')}
        </ul>
        <div class="bill-summary">
          <div class="bill-total">
            <span>Totaal:</span>
            <strong>${formatPrice(total)}</strong>
          </div>
          <div class="bill-actions">
            ${!isGuest ? '<button class="bill-account-btn" type="button">Naar mijn rekening</button>' : ''}
            <button class="bill-close-btn" type="button">Direct afrekenen</button>
          </div>
        </div>
        `
    }
  `;

  bill.querySelectorAll('.bill-item-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = btn.closest('.bill-item').dataset.itemId;
      await removeOrderItem(itemId);
      await refreshBill(orderId);
    });
  });

  bill.querySelector('.bill-close-btn')?.addEventListener('click', async () => {
    if (items.length === 0) return;

    if (isGuest) {
      try {
        await startGuestPayment(
          orderId,
          total.toFixed(2),
          `Ping Pong Hub order #${orderId}`
        );
      } catch (err) {
        console.error('Payment error:', err);
        alert('Could not start payment. Please try again.');
      }
    } else {
      await closeOrder(orderId);
      bill.innerHTML = '<p class="bill-empty">Bill closed. Thanks!</p>';
    }
  });

  bill.querySelector('.bill-account-btn')?.addEventListener('click', async () => {
    if (items.length === 0) return;

    if (isGuest) {
      alert('Log in om de bestelling op je rekening te zetten.');
      return;
    }

    await putOrderOnAccount(orderId);
    bill.innerHTML = '<p class="bill-empty">Bestelling staat op je rekening.</p>';
  });
}

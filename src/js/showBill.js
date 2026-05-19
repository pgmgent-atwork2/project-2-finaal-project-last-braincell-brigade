import { getOrderItems, removeOrderItem, closeOrder, startGuestPayment } from "../api/orders.js";
import { supabase } from "../../backend/config/supabaseClient.js";

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
      ? '<p class="bill-empty">No drinks yet.</p>'
      : `<ul class="bill-items">
          ${items.map(item => `
            <li class="bill-item" data-item-id="${item.id}">
              <span class="bill-item-name">${item.drinks.name}</span>
              <span class="bill-item-qty">x${item.quantity}</span>
              <span class="bill-item-price">€${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</span>
              <button class="bill-item-remove" aria-label="Remove ${item.drinks.name}">✕</button>
            </li>
          `).join('')}
        </ul>
        <div class="bill-total">
          <span>Total</span>
          <span>€${total.toFixed(2)}</span>
        </div>
        <button class="bill-close-btn">${isGuest ? 'Pay now' : 'Close bill'}</button>`
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
}
import { getOrderItems, removeOrderItem, closeOrder } from "../api/orders.js";

export async function refreshBill(orderId) {
  const items = await getOrderItems(orderId);
  const bill = document.querySelector('.bill');
  if (!bill) return;

  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.price_at_order) * item.quantity;
  }, 0);

  bill.innerHTML = `
    <h2 class="bill-title">Your bill</h2>
    ${items.length === 0
      ? '<p class="bill-empty">No drinks yet.</p>'
      : `<ul class="bill-items">
          ${items.map(item => `
            <li class="bill-item" data-item-id="${item.id}">
              <span class="bill-item-name">${item.drinks.name}</span>
              <span class="bill-item-qty">x${item.quantity}</span>
              <span class="bill-item-price">€${(parseFloat(item.price_at_order) * item.quantity)}</span>
              <button class="bill-item-remove" aria-label="Remove ${item.drinks.name}">✕</button>
            </li>
          `).join('')}
        </ul>
        <div class="bill-total">
          <span>Total</span>
          <span>€${total.toFixed(2)}</span>
        </div>
        <button class="bill-close-btn">Close bill</button>`
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
    await closeOrder(orderId);
    bill.innerHTML = '<p class="bill-empty">Bill closed. Thanks!</p>';
  });
}
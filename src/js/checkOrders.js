import { getClosedOrders, getOpenOrders } from '../api/orders.js';

let allClosedOrders = [];
let allOpenOrders = [];

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function renderOrders(orders, listId, { emptyMessage, timeLabel, icon }) {
  const list = document.querySelector(listId);
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = `<p class="order-empty">${emptyMessage}</p>`;
    return;
  }

  list.innerHTML = orders.map((order, i) => {
    const total = order.order_items.reduce((sum, item) => {
      return sum + parseFloat(item.price_at_order) * item.quantity;
    }, 0);

    const rowClass = i % 2 === 0 ? 'order-row-gray' : 'order-row-white';
    const timestamp = timeLabel === 'Made at' ? order.created_at : order.updated_at;

    return `
      <div class="order-row ${rowClass}">
        <div class="order-item">
          <div class="order-icon">${icon}</div>
          <div class="order-info">
            <p class="order-id" id="ORD-${order.id}">ORD-${order.id}</p>
            <p class="order-customer">${order.order_items.length} item(s) · €${total.toFixed(2)}</p>
          </div>
          <p class="order-time">${timeLabel} ${formatDateTime(timestamp)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function applyFilter(filter) {
  const runningSection = document.querySelector('#running-order-list');
  const paidSection = document.querySelector('#paid-order-list');

  switch (filter) {
    case 'Paid':
      runningSection.hidden = true;
      paidSection.hidden = false;
      break;
    case 'Running':
      runningSection.hidden = false;
      paidSection.hidden = true;
      break;
    case 'Canceled':
      runningSection.hidden = true;
      paidSection.hidden = true;
      break;
    case 'All':
    default:
      runningSection.hidden = false;
      paidSection.hidden = false;
      break;
  }
}

function bindFilterButtons() {
  const buttons = document.querySelectorAll('.filter-buttons');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.textContent.trim());
    });
  });

  buttons[0]?.classList.add('active');
}

function searchOrders() {
  const input = document.querySelector('#search-input');
  const query = input.value.trim().toLowerCase();

  if (!query) {
    renderOrders(allClosedOrders, '#paid-order-list', {
      emptyMessage: 'No paid orders yet.',
      timeLabel: 'Closed at',
      icon: '✅'
    });

    renderOrders(allOpenOrders, '#running-order-list', {
      emptyMessage: 'No running orders.',
      timeLabel: 'Made at',
      icon: '🔄'
    });

    return;
  }

  const filterOrders = (orders) => {
    return orders.filter(order => {
      const orderId = `ord-${order.id}`.toLowerCase();

      const customerName = order.profiles
        ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.toLowerCase()
        : '';

      return (
        orderId.includes(query) ||
        customerName.includes(query)
      );
    });
  };

  const filteredClosed = filterOrders(allClosedOrders);
  const filteredOpen = filterOrders(allOpenOrders);

  renderOrders(filteredClosed, '#paid-order-list', {
    emptyMessage: 'No matching paid orders.',
    timeLabel: 'Closed at',
    icon: '✅'
  });

  renderOrders(filteredOpen, '#running-order-list', {
    emptyMessage: 'No matching running orders.',
    timeLabel: 'Made at',
    icon: '🔄'
  });
}

async function init() {
  const [closedOrders, openOrders] = await Promise.all([
    getClosedOrders(),
    getOpenOrders()
  ]);

  allClosedOrders = closedOrders;
  allOpenOrders = openOrders;

  renderOrders(allClosedOrders, '#paid-order-list', {
    emptyMessage: 'No paid orders yet.',
    timeLabel: 'Closed at',
    icon: '✅'
  });

  renderOrders(allOpenOrders, '#running-order-list', {
    emptyMessage: 'No running orders.',
    timeLabel: 'Made at',
    icon: '🔄'
  });

  bindFilterButtons();

  const searchButton = document.querySelector('#search-button');
    const searchInput = document.querySelector('#search-input');
  
    searchButton.addEventListener('click', searchOrders);
  
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchOrders();
      }
    });
}

init();
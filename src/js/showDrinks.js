import { getDrinks } from "../api/drinks.js";
import { getOrCreateOrder, addDrinkToOrder } from "../api/orders.js";
import { refreshBill } from "./showBill.js";

let allDrinks = [];
let currentOrder = null;

function createDrinkCard(drink) {
  const article = document.createElement('article');
  article.className = 'card';
  article.style.cursor = 'pointer';

  article.innerHTML = `
    <div class="image-container">
      <img class="image" src="${drink.image_url}" alt="${drink.name}" />
    </div>
    <div class="text-content">
      <h2 class="div">${drink.name}</h2>
      <p class="subtitle">€${drink.price}</p>
    </div>
  `;

  article.addEventListener('click', async () => {
  if (article.dataset.loading) return; 
  article.dataset.loading = 'true';
  try {
    await addDrinkToOrder(currentOrder.id, drink);
    await refreshBill(currentOrder.id);
  } finally {
    delete article.dataset.loading;
  }
});

  return article;
}

export function renderDrinks(categoryId = null) {
  const list = document.querySelector('.list');
  if (!list) return;

  const filtered = categoryId
    ? allDrinks.filter(d => d.category_id === categoryId)
    : allDrinks;

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<p class="no-drinks">No drinks found.</p>';
    return;
  }

  filtered.forEach(drink => list.appendChild(createDrinkCard(drink)));
}

async function loadDrinks() {
  allDrinks = await getDrinks() || [];
  currentOrder = await getOrCreateOrder();
  renderDrinks();
  refreshBill(currentOrder.id);
}

loadDrinks();
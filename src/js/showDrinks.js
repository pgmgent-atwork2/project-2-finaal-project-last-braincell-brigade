import { getDrinks } from "../api/drinks.js";
import { getOrCreateOrder, addDrinkToOrder } from "../api/orders.js";
import { refreshBill } from "./showBill.js";

let allDrinks = [];
let currentOrder = null;

function createDrinkCard(drink) {
  const article = document.createElement('article');
  article.className = 'card';

  article.innerHTML = `
    <div class="image-container">
      <img class="image" src="${drink.image_url}" alt="${drink.name}" />
    </div>
    <div class="text-content">
      <h2 class="div">${drink.name}</h2>
      <p class="subtitle">€${drink.price}</p>
      <div class="icon-buttons" aria-label="Actions for ${drink.name}">
        <button class="icon add-btn" type="button" aria-label="Add ${drink.name}">➕</button>
      </div>
    </div>
  `;

  article.querySelector('.add-btn').addEventListener('click', async () => {
    await addDrinkToOrder(currentOrder.id, drink);
    await refreshBill(currentOrder.id);
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
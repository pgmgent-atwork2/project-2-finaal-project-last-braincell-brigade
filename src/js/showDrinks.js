import { getDrinks } from "../api/drinks.js";
import { getOrCreateOrder, addDrinkToOrder } from "../api/orders.js";
import { refreshBill } from "./showBill.js";

let allDrinks = [];
let currentOrder = null;
let activeCategoryId = null;

function createDrinkCard(drink) {
  const article = document.createElement('article');
  article.className = 'card';
  let quantity = 1;

  article.innerHTML = `
    <div class="image-container">
      <img class="image" src="${drink.image_url}" alt="${drink.name}" />
    </div>
    <div class="text-content">
      <h2 class="drink-name">${drink.name}</h2>
      <div class="drink-actions">
        <p class="subtitle">€${Number(drink.price).toFixed(2).replace('.', ',')}</p>
        <button class="quantity-button" type="button" aria-label="Decrease ${drink.name}">−</button>
        <span class="quantity-count">1</span>
        <button class="quantity-button" type="button" aria-label="Increase ${drink.name}">+</button>
        <button class="add-drink-button" type="button">Toevoegen</button>
      </div>
    </div>
  `;

  const decreaseButton = article.querySelector('[aria-label^="Decrease"]');
  const increaseButton = article.querySelector('[aria-label^="Increase"]');
  const quantityCount = article.querySelector('.quantity-count');

  decreaseButton.addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    quantityCount.textContent = quantity;
  });

  increaseButton.addEventListener('click', () => {
    quantity += 1;
    quantityCount.textContent = quantity;
  });

  article.querySelector('.add-drink-button').addEventListener('click', async () => {
    if (article.dataset.loading) return;
    article.dataset.loading = 'true';

    try {
      await addDrinkToOrder(currentOrder.id, drink, quantity);
      await refreshBill(currentOrder.id);
    } finally {
      delete article.dataset.loading;
    }
  });

  return article;
}

export function renderDrinks(categoryId = activeCategoryId) {
  const list = document.querySelector('.list');
  if (!list) return;

  activeCategoryId = categoryId;

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
  const list = document.querySelector('.list');

  try {
    allDrinks = await getDrinks() || [];
    currentOrder = await getOrCreateOrder();
    renderDrinks();

    if (currentOrder?.id) {
      refreshBill(currentOrder.id);
    }
  } catch (error) {
    console.error('Could not load drinks:', error);

    if (list) {
      list.innerHTML = '<p class="no-drinks">Could not load drinks. Check your Supabase env keys and browser console.</p>';
    }
  }
}

loadDrinks();

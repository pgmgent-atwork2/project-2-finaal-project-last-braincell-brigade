import { getDrinks } from "../api/drinks.js";

let allDrinks = [];

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
        <button class="icon" type="button" aria-label="Add ${drink.name}">➕</button>
        <button class="icon" type="button" aria-pressed="false" aria-label="${drink.name} selected">✅</button>
      </div>
    </div>
  `;

  return article;
}

export function renderDrinks(categoryId = null) {
  const list = document.querySelector('.list');
  if (!list) return;

  const filtered = categoryId
    ? allDrinks.filter(d => d.category_id === categoryId)
    : allDrinks;

  if (filtered.length === 0) {
    list.innerHTML = '<p class="no-drinks">No drinks found.</p>';
    return;
  }

  list.innerHTML = '';
  filtered.forEach(drink => list.appendChild(createDrinkCard(drink)));
}

async function loadDrinks() {
  allDrinks = await getDrinks() || [];
  renderDrinks();
}

loadDrinks();
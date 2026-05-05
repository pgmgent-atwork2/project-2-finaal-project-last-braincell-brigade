import { getDrinks } from "../api/drinks.js";

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

function renderDrinks(drinks) {
  const list = document.querySelector('.list');

  if (!list) {
    console.error('Could not find .list container');
    return;
  }

  if (!Array.isArray(drinks) || drinks.length === 0) {
    list.innerHTML = '<p class="no-drinks">No drinks found.</p>';
    return;
  }

  list.innerHTML = '';

  drinks.forEach(drink => {
    list.appendChild(createDrinkCard(drink));
  });
}

async function loadDrinks() {
  const drinks = await getDrinks();
  renderDrinks(drinks || []);
}

loadDrinks();
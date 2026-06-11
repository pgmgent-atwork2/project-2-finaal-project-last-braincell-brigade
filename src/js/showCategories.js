import { getCategories } from "../api/categories.js";
import { renderDrinks } from "./showDrinks.js";

async function displayCategories() {
  const categories = await getCategories();
  const categoriesContainer = document.querySelector('.categories');
  const title = document.querySelector('.drank-title');

  if (!categoriesContainer) return;

  const allButton = document.createElement('button');
  allButton.className = 'category-button active';
  allButton.textContent = 'All';
  allButton.setAttribute('aria-pressed', 'true');
  allButton.dataset.categoryId = 'all';
  categoriesContainer.appendChild(allButton);

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-button';
    button.textContent = category.name;
    button.setAttribute('aria-pressed', 'false');
    button.dataset.categoryId = category.id;
    categoriesContainer.appendChild(button);
  });

  renderDrinks(null);
  if (title) {
    title.textContent = 'All drinks:';
  }

  categoriesContainer.addEventListener('click', e => {
    const btn = e.target.closest('.category-button');
    if (!btn) return;

    categoriesContainer.querySelectorAll('.category-button').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    const selectedId = btn.dataset.categoryId;
    renderDrinks(selectedId === 'all' ? null : Number(selectedId));

    if (title) {
      title.textContent = selectedId === 'all' ? 'All drinks:' : `${btn.textContent}:`;
    }
  });
}

displayCategories();

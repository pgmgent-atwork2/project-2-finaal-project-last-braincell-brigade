import { addDrink } from "../api/drinks";
import { getCategories } from "../api/categories.js";

export async function setupAddDrink() {
    const addBtn = document.querySelector('#add-drink-btn');
    const nameInput = document.querySelector('#add-drink-name');
    const priceInput = document.querySelector('#add-drink-price');
    const productsRow = document.querySelector('.products__row');

    if (!addBtn || !nameInput || !priceInput) {
        console.error('Add drink elements not found');
        return;
    }

    addBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value.trim());

        if (!name || isNaN(price)) {
            alert('Please enter a valid name and price.');
            return;
        }

        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';

        try {
            const newDrink = await addDrink({
                name,
                price
            });

            if (!newDrink) {
                throw new Error('Failed to add drink');
            }

            const card = document.createElement('div');
            card.className = 'card';

            card.innerHTML = `
                <div class="card__image">
                    <span class="card__image-label">
                        ${newDrink.name}
                    </span>
                </div>

                <div class="card__text">
                    <p class="card__name">${newDrink.name}</p>
                    <p class="card__desc">$${Number(newDrink.price)}</p>
                </div>
            `;

            productsRow.prepend(card);

            nameInput.value = '';
            priceInput.value = '';

            alert(`Drink "${newDrink.name}" added successfully!`);

        } catch (error) {
            console.error(error);
            alert('Failed to add drink. Please try again.');
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Add drink';
        }
    });
}

export async function loadCategories() {
    const categories = await getCategories();
    const categoryGroup = document.querySelector('#chip-group');

    categories.forEach(item => {
        categoryGroup.innerHTML += `
            <div class="chip" data-category-id="${item.id}">${item.name}</div>
        `;
    });
}

loadCategories();
setupAddDrink();
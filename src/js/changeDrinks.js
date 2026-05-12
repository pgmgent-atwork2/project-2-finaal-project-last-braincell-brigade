import { addDrink, getDrinks, updateDrink, uploadDrinkImage } from "../api/drinks";
import { getCategories } from "../api/categories.js";

let allDrinks = [];
let selectedDrink = null;

function openModal(id) {
    const modal = document.querySelector(`#${id}`);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const modal = document.querySelector(`#${id}`);
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
}

function setupModalTriggers() {
    document.querySelector('#open-add-modal')?.addEventListener('click', () => {
        openModal('add-modal');
    });

    document.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not([hidden])').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

async function loadChipGroup(chipGroupId) {
    const categories = await getCategories();
    const group = document.querySelector(`#${chipGroupId}`);
    if (!group) return;

    group.innerHTML = categories.map(item => `
        <div class="chip" data-category-id="${item.id}" id="${chipGroupId}-chip-${item.id}">
            ${item.name}
        </div>
    `).join('');

    group.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            group.querySelectorAll('.chip').forEach(c => c.classList.remove('active-chip'));
            e.currentTarget.classList.add('active-chip');
        });
    });
}

function setupImagePreview(inputId, previewId) {
    const input = document.querySelector(`#${inputId}`);
    const preview = document.querySelector(`#${previewId}`);
    if (!input || !preview) return;

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
    });
}

export async function setupAddDrink() {
    const addBtn = document.querySelector('#add-drink-btn');
    const nameInput = document.querySelector('#add-drink-name');
    const priceInput = document.querySelector('#add-drink-price');
    const imageInput = document.querySelector('#add-drink-image');

    if (!addBtn || !nameInput || !priceInput || !imageInput) {
        console.error('Add drink elements not found');
        return;
    }

    addBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value.trim());
        const selectedChip = document.querySelector('#chip-group .active-chip');
        const categoryId = selectedChip?.dataset.categoryId;
        const file = imageInput?.files[0];

        if (!name || isNaN(price) || !categoryId || !file) {
            alert('Please enter a valid name, price, category, and image.');
            return;
        }

        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';

        try {
            let image_url = null;

            if (file) {
                image_url = await uploadDrinkImage(file);
                if (!image_url) throw new Error('Image upload failed');
            }

            const newDrink = await addDrink({
                name,
                price,
                category_id: Number(categoryId),
                ...(image_url && { image_url })
            });

            if (!newDrink) throw new Error('Failed to add drink');

            allDrinks.unshift(newDrink);
            renderDrinks(allDrinks);

            nameInput.value = '';
            priceInput.value = '';
            if (imageInput) imageInput.value = '';
            document.querySelector('#add-drink-preview').hidden = true;
            document.querySelector('#chip-group .active-chip')?.classList.remove('active-chip');

            closeModal('add-modal');
            alert(`Drink "${newDrink.name}" added successfully!`);
        } catch (err) {
            console.error(err);
            alert('Failed to add drink. Please try again.');
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Add drink';
        }
    });
}

export function setupSearch() {
    const nameInput = document.querySelector('#search-drink-name');
    const applyBtn = document.querySelector('#search-apply-btn');
    const cancelBtn = document.querySelector('#search-cancel-btn');

    applyBtn?.addEventListener('click', () => {
        const query = nameInput?.value.trim().toLowerCase() ?? '';
        const selectedChip = document.querySelector('#search-chip-group .active-chip');
        const categoryId = selectedChip ? Number(selectedChip.dataset.categoryId) : null;

        const filtered = allDrinks.filter(drink => {
            const matchesName = !query || drink.name.toLowerCase().includes(query);
            const matchesCategory = !categoryId || drink.category_id === categoryId;
            return matchesName && matchesCategory;
        });

        renderDrinks(filtered);
    });

    cancelBtn?.addEventListener('click', () => {
        if (nameInput) nameInput.value = '';
        document.querySelector('#search-chip-group .active-chip')?.classList.remove('active-chip');
        renderDrinks(allDrinks);
    });

    nameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyBtn?.click();
    });
}

function renderDrinks(drinks) {
    const list = document.querySelector('.products__list');
    if (!list) return;

    if (!drinks.length) {
        list.innerHTML = '<p class="subtext" style="grid-column:1/-1">No drinks found.</p>';
        return;
    }

    const rows = [];
    for (let i = 0; i < drinks.length; i += 3) {
        rows.push(drinks.slice(i, i + 3));
    }

    list.innerHTML = rows.map(row => `
        <div class="products__row">
            ${row.map(drink => `
                <div class="card" data-drink-id="${drink.id}">
                    <div class="card__image">
                        <img src="${drink.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${drink.name}">
                    </div>
                    <div class="card__text">
                        <p class="card__name">${drink.name}</p>
                        <p class="card__desc">$${Number(drink.price).toFixed(2)}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    list.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const drinkId = Number(card.dataset.drinkId);
            const drink = allDrinks.find(d => d.id === drinkId);
            if (drink) populateEditForm(drink);
        });
    });
}

function populateEditForm(drink) {
    selectedDrink = drink;

    const nameInput = document.querySelector('#edit-drink-name');
    const priceInput = document.querySelector('#edit-drink-price');
    const currentImage = document.querySelector('#edit-current-image');
    const imageInput = document.querySelector('#edit-drink-image');
    const preview = document.querySelector('#edit-drink-preview');

    if (nameInput) nameInput.value = drink.name;
    if (priceInput) priceInput.value = drink.price;

    if (currentImage) {
        currentImage.src = drink.image_url || 'https://via.placeholder.com/300x200?text=No+Image';
        currentImage.hidden = false;
    }
    if (imageInput) imageInput.value = '';
    if (preview) preview.hidden = true;

    const chips = document.querySelectorAll('#edit-chip-group .chip');
    chips.forEach(chip => {
        chip.classList.toggle('active-chip', Number(chip.dataset.categoryId) === drink.category_id);
    });

    openModal('edit-modal');
}

export function setupEditDrink() {
    const updateBtn = document.querySelector('#update-drink-btn');
    const resetBtn = document.querySelector('#edit-reset-btn');
    const nameInput = document.querySelector('#edit-drink-name');
    const priceInput = document.querySelector('#edit-drink-price');
    const imageInput = document.querySelector('#edit-drink-image');

    resetBtn?.addEventListener('click', () => {
        if (selectedDrink) populateEditForm(selectedDrink);
    });

    updateBtn?.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!selectedDrink) {
            alert('Select a drink from the list first.');
            return;
        }

        const name = nameInput?.value.trim();
        const price = parseFloat(priceInput?.value.trim());
        const selectedChip = document.querySelector('#edit-chip-group .active-chip');
        const categoryId = selectedChip ? Number(selectedChip.dataset.categoryId) : null;
        const file = imageInput?.files[0];

        if (!name || isNaN(price)) {
            alert('Please enter a valid name and price.');
            return;
        }

        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating...';

        try {
            let image_url = selectedDrink.image_url;

            if (file) {
                image_url = await uploadDrinkImage(file, selectedDrink.id);
                if (!image_url) throw new Error('Image upload failed');
            }

            const updated = await updateDrink(selectedDrink.id, {
                name,
                price,
                image_url,
                ...(categoryId && { category_id: categoryId })
            });

            if (!updated) throw new Error('Update failed');

            const idx = allDrinks.findIndex(d => d.id === updated.id);
            if (idx !== -1) allDrinks[idx] = updated;

            selectedDrink = updated;
            renderDrinks(allDrinks);

            closeModal('edit-modal');
            alert(`Drink "${updated.name}" updated!`);
        } catch (err) {
            console.error(err);
            alert('Failed to update drink. Please try again.');
        } finally {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update drink';
        }
    });
}

export async function init() {
    allDrinks = await getDrinks() ?? [];
    renderDrinks(allDrinks);

    await Promise.all([
        loadChipGroup('chip-group'),
        loadChipGroup('search-chip-group'),
        loadChipGroup('edit-chip-group'),
    ]);

    setupImagePreview('add-drink-image', 'add-drink-preview');
    setupImagePreview('edit-drink-image', 'edit-drink-preview');

    setupModalTriggers();
    setupAddDrink();
    setupSearch();
    setupEditDrink();
}

init();
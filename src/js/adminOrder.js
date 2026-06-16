import { addDrink, deleteDrink, getDrinks, updateDrink, uploadDrinkImage } from "../api/drinks";
import { getCategories } from "../api/categories.js";

const placeholderImage = "../assets/images/image-mandje.png";

let drinks = [];
let categories = [];
let selectedDrink = null;
let selectedImageFile = null;

const elements = {
  list: document.querySelector("#admin-drinks-list"),
  categoryList: document.querySelector("#admin-category-list"),
  categorySelect: document.querySelector("#admin-drink-category"),
  preview: document.querySelector("#admin-drink-preview"),
  imageInput: document.querySelector("#admin-drink-image"),
  nameInput: document.querySelector("#admin-drink-name"),
  priceInput: document.querySelector("#admin-drink-price"),
  promoSelect: document.querySelector("#admin-drink-promo"),
  addButton: document.querySelector("#admin-add-drink"),
  updateButton: document.querySelector("#admin-update-drink"),
  removeButton: document.querySelector("#admin-remove-drink"),
};

function moneyValue(value) {
  const number = Number(value);
  return Number.isNaN(number) ? "" : number.toFixed(2);
}

function renderDrinkList() {
  if (!elements.list) return;

  if (!drinks.length) {
    elements.list.innerHTML = '<p class="order-empty-state">No drinks yet.</p>';
    return;
  }

  elements.list.innerHTML = drinks.map((drink) => `
    <button class="admin-drink-row ${selectedDrink?.id === drink.id ? "active" : ""}" type="button" data-drink-id="${drink.id}">
      <span class="admin-drink-icon">i</span>
      <span>${drink.name}</span>
    </button>
  `).join("");

  elements.list.querySelectorAll("[data-drink-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const drink = drinks.find((item) => item.id === Number(button.dataset.drinkId));
      selectDrink(drink);
    });
  });
}

function renderCategories() {
  if (elements.categorySelect) {
    elements.categorySelect.innerHTML = '<option value="">Categorie</option>' + categories.map((category) => `
      <option value="${category.id}">${category.name}</option>
    `).join("");
  }

  if (elements.categoryList) {
    elements.categoryList.innerHTML = categories.map((category) => `
      <div class="admin-category-row">
        <span>${category.name}</span>
        <span>↗</span>
      </div>
    `).join("");
  }
}

function selectDrink(drink) {
  selectedDrink = drink ?? null;
  selectedImageFile = null;

  if (elements.imageInput) elements.imageInput.value = "";
  if (elements.preview) elements.preview.src = selectedDrink?.image_url || placeholderImage;
  if (elements.nameInput) elements.nameInput.value = selectedDrink?.name || "";
  if (elements.priceInput) elements.priceInput.value = selectedDrink ? moneyValue(selectedDrink.price) : "";
  if (elements.promoSelect) elements.promoSelect.value = selectedDrink?.in_promo ? "true" : "";
  if (elements.categorySelect) elements.categorySelect.value = selectedDrink?.category_id || "";
  if (elements.updateButton) elements.updateButton.textContent = selectedDrink ? "Edit item" : "Save new item";

  renderDrinkList();
}

function getFormDrink() {
  const name = elements.nameInput?.value.trim();
  const price = Number(elements.priceInput?.value);
  const categoryId = Number(elements.categorySelect?.value);

  if (!name || Number.isNaN(price)) {
    alert("Please enter a valid drink name and price.");
    return null;
  }

  return {
    name,
    price,
    ...(categoryId ? { category_id: categoryId } : {}),
  };
}

async function saveDrink() {
  const drinkValues = getFormDrink();
  if (!drinkValues) return;

  elements.updateButton.disabled = true;
  elements.updateButton.textContent = "Saving...";

  try {
    let image_url = selectedDrink?.image_url;

    if (selectedImageFile) {
      image_url = await uploadDrinkImage(selectedImageFile, selectedDrink?.id);
    }

    const payload = {
      ...drinkValues,
      ...(image_url && { image_url }),
    };

    const savedDrink = selectedDrink
      ? await updateDrink(selectedDrink.id, payload)
      : await addDrink(payload);

    if (!savedDrink) throw new Error("Drink could not be saved.");

    const index = drinks.findIndex((drink) => drink.id === savedDrink.id);
    if (index >= 0) {
      drinks[index] = savedDrink;
    } else {
      drinks.unshift(savedDrink);
    }

    drinks.sort((a, b) => a.name.localeCompare(b.name));
    selectDrink(savedDrink);
  } catch (error) {
    console.error(error);
    alert("Could not save the drink. Please try again.");
  } finally {
    elements.updateButton.disabled = false;
    elements.updateButton.textContent = selectedDrink ? "Edit item" : "Save new item";
  }
}

async function removeSelectedDrink() {
  if (!selectedDrink) {
    alert("Select a drink first.");
    return;
  }

  const confirmed = window.confirm(`Remove "${selectedDrink.name}"?`);
  if (!confirmed) return;

  elements.removeButton.disabled = true;

  try {
    const deleted = await deleteDrink(selectedDrink.id);
    if (!deleted) throw new Error("Drink could not be removed.");

    drinks = drinks.filter((drink) => drink.id !== selectedDrink.id);
    selectDrink(drinks[0]);
  } catch (error) {
    console.error(error);
    alert("Could not remove the drink. Please try again.");
  } finally {
    elements.removeButton.disabled = false;
  }
}

function setupEvents() {
  elements.addButton?.addEventListener("click", () => {
    selectDrink(null);
    elements.nameInput?.focus();
  });

  elements.updateButton?.addEventListener("click", saveDrink);
  elements.removeButton?.addEventListener("click", removeSelectedDrink);

  elements.imageInput?.addEventListener("change", () => {
    selectedImageFile = elements.imageInput.files?.[0] ?? null;

    if (selectedImageFile && elements.preview) {
      elements.preview.src = URL.createObjectURL(selectedImageFile);
    }
  });
}

async function initOrderAdmin() {
  if (!elements.list) return;

  [drinks, categories] = await Promise.all([
    getDrinks().then((items) => items ?? []),
    getCategories().then((items) => items ?? []),
  ]);

  renderCategories();
  setupEvents();
  selectDrink(drinks[0]);
}

initOrderAdmin();

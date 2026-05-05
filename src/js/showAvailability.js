import { getAvailability, addAvailability, removeAvailability, clearAvailability } from '../api/availability.js';
import { supabase } from '../../backend/config/supabaseClient.js';

let currentYear;
let currentMonth;
let availableDates = new Set();
let pendingDates = new Set(); // staged changes, saved on "Save selection"
let userId;

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function renderCalendar() {
  const grid = document.querySelector('.calendar-grid');
  const monthLabel = document.querySelector('.month-label');

  monthLabel.textContent = new Date(currentYear, currentMonth).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  grid.innerHTML = weeks.map((week, wi) => `
    <div class="calendar-week" role="list" aria-label="Week ${wi + 1}">
      ${week.map(day => {
        const dateStr = formatDate(currentYear, currentMonth, day);
        const isAvailable = availableDates.has(dateStr);
        return `
          <button
            class="day-btn${isAvailable ? ' available' : ''}"
            type="button"
            role="listitem"
            aria-pressed="${isAvailable}"
            data-date="${dateStr}"
          >${day}</button>
        `;
      }).join('')}
    </div>
  `).join('');

  grid.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const date = btn.dataset.date;
      const isNowAvailable = !availableDates.has(date);

      if (isNowAvailable) {
        availableDates.add(date);
      } else {
        availableDates.delete(date);
      }

      btn.classList.toggle('available', isNowAvailable);
      btn.setAttribute('aria-pressed', String(isNowAvailable));

      // Sync to DB immediately on individual tap
      if (isNowAvailable) {
        await addAvailability(userId, date);
      } else {
        await removeAvailability(userId, date);
      }
    });
  });
}

function bindMonthNav() {
  document.querySelector('[aria-label="Previous month"]').addEventListener('click', () => {
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else currentMonth--;
    renderCalendar();
  });

  document.querySelector('[aria-label="Next month"]').addEventListener('click', () => {
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else currentMonth++;
    renderCalendar();
  });
}

function bindClearButton() {
  document.querySelector('[aria-label="Clear selected dates"]').addEventListener('click', async () => {
    // Update UI
    document.querySelectorAll('.day-btn.available').forEach(btn => {
      btn.classList.remove('available');
      btn.setAttribute('aria-pressed', 'false');
    });

    availableDates.clear();

    // Sync to DB
    await clearAvailability(userId);
  });
}

function bindSaveButton() {
  document.querySelector('[aria-label="Save selected dates"]').addEventListener('click', async () => {
    const btn = document.querySelector('[aria-label="Save selected dates"]');
    btn.textContent = 'Saving…';
    btn.disabled = true;

    // Replace all DB rows with current state
    await clearAvailability(userId);

    await Promise.all(
      [...availableDates].map(date => addAvailability(userId, date))
    );

    btn.textContent = 'Saved ✓';
    setTimeout(() => {
      btn.textContent = 'Save selection';
      btn.disabled = false;
    }, 1500);
  });
}

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  userId = user.id;

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  const existing = await getAvailability(userId);
  availableDates = new Set(existing.map(row => row.date));

  renderCalendar();
  bindMonthNav();
  bindClearButton();
  bindSaveButton();
}

init();
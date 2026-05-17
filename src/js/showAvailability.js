import { getAvailability, addAvailability, removeAvailability, clearAvailability } from '../api/availability.js';
import { registerForMatch, getMyRegistrations, unregisterFromMatch } from '../api/registration.js';
import { getMatches } from '../api/matches.js';
import { supabase } from '../../backend/config/supabaseClient.js';

const HOME_TEAM = 'HNO Assenede A';

let currentYear;
let currentMonth;
let availableDates = new Set();
let userId;

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ── Match helpers ─────────────────────────────────────────────────────────────

function isHome(match) {
  return match.Title?.startsWith(HOME_TEAM);
}

function getOpponent(match) {
  const title = match.Title ?? '';
  return title
    .replace(`${HOME_TEAM} / `, '')
    .replace(` / ${HOME_TEAM}`, '')
    .trim();
}

function formatMatchDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function isUpcoming(match) {
  return match.Starts && new Date(match.Starts).getTime() > Date.now();
}

// ── Match cards ───────────────────────────────────────────────────────────────

async function renderMatchCards() {
  const grid = document.getElementById('matches-grid');
  if (!grid) return;

  let matches, registeredMatchIds;
  try {
    [matches, registeredMatchIds] = await Promise.all([
      getMatches(),
      getMyRegistrations(),
    ]);
  } catch {
    grid.innerHTML = '<p class="matches-empty">Could not load matches.</p>';
    return;
  }

  const upcoming = matches.filter(isUpcoming);

  if (!upcoming.length) {
    grid.innerHTML = '<p class="matches-empty">No upcoming matches.</p>';
    return;
  }

  const registeredSet = new Set(registeredMatchIds);

  grid.innerHTML = upcoming.map((match, i) => {
    const opponent = getOpponent(match);
    const location = match.Location ?? '';
    const time = formatMatchDateTime(match.Starts);
    const titleId = `match-${match.id ?? i}-title`;
    const isRegistered = registeredSet.has(match.id);

    return `
      <article class="match-card" role="listitem" aria-labelledby="${titleId}">
        <div class="match-icon" aria-hidden="true">🏓</div>
        <div class="match-info">
          <h3 id="${titleId}">${isHome(match) ? 'Home' : 'Away'} vs ${opponent}</h3>
          <p class="match-meta">${location} · ${time}</p>
        </div>
        <button
          class="register-btn${isRegistered ? ' registered' : ''}"
          type="button"
          aria-pressed="${isRegistered}"
          data-match-id="${match.id}"
        >${isRegistered ? 'Registered ✓' : 'Register'}</button>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.register-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = btn.dataset.matchId;
      const isRegistered = btn.getAttribute('aria-pressed') === 'true';

      btn.disabled = true;
      btn.textContent = isRegistered ? 'Removing…' : 'Registering…';

      try {
        if (isRegistered) {
          await unregisterFromMatch(matchId);
          btn.setAttribute('aria-pressed', 'false');
          btn.textContent = 'Register';
          btn.classList.remove('registered');
        } else {
          await registerForMatch(matchId);
          btn.setAttribute('aria-pressed', 'true');
          btn.textContent = 'Registered ✓';
          btn.classList.add('registered');
        }
      } catch {
        // Revert label on failure
        btn.textContent = isRegistered ? 'Registered ✓' : 'Register';
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// ── Calendar ──────────────────────────────────────────────────────────────────

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

      if (isNowAvailable) {
        await addAvailability(userId, date);
      } else {
        await removeAvailability(userId, date);
      }
    });
  });
}

// ── Controls ──────────────────────────────────────────────────────────────────

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
    document.querySelectorAll('.day-btn.available').forEach(btn => {
      btn.classList.remove('available');
      btn.setAttribute('aria-pressed', 'false');
    });

    availableDates.clear();
    await clearAvailability(userId);
  });
}

function bindSaveButton() {
  document.querySelector('[aria-label="Save selected dates"]').addEventListener('click', async () => {
    const btn = document.querySelector('[aria-label="Save selected dates"]');
    btn.textContent = 'Saving…';
    btn.disabled = true;

    await clearAvailability(userId);
    await Promise.all([...availableDates].map(date => addAvailability(userId, date)));

    btn.textContent = 'Saved ✓';
    setTimeout(() => {
      btn.textContent = 'Save selection';
      btn.disabled = false;
    }, 1500);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  userId = user.id;

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  const existing = await getAvailability(userId);
  availableDates = new Set(existing.map(row => row.date));

  await renderMatchCards();
  renderCalendar();
  bindMonthNav();
  bindClearButton();
  bindSaveButton();
}

init();
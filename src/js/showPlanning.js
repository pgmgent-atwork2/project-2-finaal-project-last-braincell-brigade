import { getMatches } from "../api/matches.js";
import {
  getMyRegistrations,
  registerForMatch,
  unregisterFromMatch,
} from "../api/registration.js";
import { getAvailability } from "../api/availability.js";
import { supabase } from "../../backend/config/supabaseClient.js";

const HOME_TEAM = 'HNO Assenede A';

let allMatches = [];
let myMatchIds = new Set();
let myAvailability = new Set();
let currentUserId = null;

function formatISO(date) {
  return date.toISOString().split('T')[0];
}

function isHome(match) {
  return match.Title?.startsWith(HOME_TEAM);
}

function formatMatchDate(isoString) {
  if (!isoString) return '';

  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}u${minutes}`;
}

function isUpcomingMatch(match) {
  if (!match.Starts) return false;
  return new Date(match.Starts) > new Date();
}

function matchType(match) {
  return isHome(match) ? 'thuismatch' : 'uitmatch';
}

function renderTeamMark() {
  return `
    <span class="team-mark team-mark--club" aria-hidden="true">
      <img src="../assets/images/HNO_Assenede_logo.png" alt="">
    </span>
  `;
}

function availableMatchRow(match) {
  return `
    <article class="match-row" data-match-id="${match.id}">
      <div class="match-teams">
        <span class="team-mark team-mark--opponent" aria-hidden="true">↔</span>
        <span class="versus">VS</span>
        ${renderTeamMark()}
      </div>

      <p class="match-date">
        ${formatMatchDate(match.Starts)} ${matchType(match)}
      </p>

      <div class="match-actions">
        <button class="match-btn match-btn--primary"
          data-register-match-id="${match.id}"
          data-reserve="false"
          type="button">
          Ik ben beschikbaar
        </button>

        <button class="match-btn match-btn--secondary"
          data-register-match-id="${match.id}"
          data-reserve="true"
          type="button">
          Ik ben beschikbaar als reserve
        </button>
      </div>
    </article>
  `;
}

function myMatchRow(match) {
  return `
    <article class="match-row match-row--mine" data-match-id="${match.id}">
      <div class="match-teams">
        <span class="team-mark team-mark--opponent" aria-hidden="true">↔</span>
        <span class="versus">VS</span>
        ${renderTeamMark()}
      </div>

      <p class="match-date">
        ${formatMatchDate(match.Starts)} ${matchType(match)}
      </p>

      <button class="cancel-btn" data-cancel-match-id="${match.id}" type="button">
        Beschikbaarheid annuleren
      </button>
    </article>
  `;
}

function renderMatches() {
  const availableList = document.querySelector('#available-matches');
  const myList = document.querySelector('#my-matches');

  if (!availableList || !myList) return;

  const upcoming = allMatches.filter(isUpcomingMatch);

  const available = upcoming.filter(m => !myMatchIds.has(m.id));
  const mine = upcoming.filter(m => myMatchIds.has(m.id));

  availableList.innerHTML = available.length
    ? available.map(availableMatchRow).join('')
    : '<p class="matches-empty">Geen beschikbare matchen gevonden.</p>';

  myList.innerHTML = mine.length
    ? mine.map(myMatchRow).join('')
    : '<p class="matches-empty">Je hebt nog geen komende matchen.</p>';

  availableList.querySelectorAll('[data-register-match-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleRegister(btn.dataset.registerMatchId, btn.dataset.reserve === 'true');
    });
  });

  myList.querySelectorAll('[data-cancel-match-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleCancel(btn.dataset.cancelMatchId);
    });
  });
}


async function handleRegister(matchId, reserve) {
  try {
    await registerForMatch(matchId, reserve);
    const regs = await getMyRegistrations();
    myMatchIds = new Set(regs);
    renderMatches();
  } catch (error) {
    console.error(error);
    alert('Kon je beschikbaarheid niet opslaan.');
  }
}

async function handleCancel(matchId) {
  try {
    await unregisterFromMatch(matchId);
    const regs = await getMyRegistrations();
    myMatchIds = new Set(regs);
    renderMatches();
  } catch (error) {
    console.error(error);
    alert('Kon je beschikbaarheid niet annuleren.');
  }
}

async function toggleAvailability(date) {
  if (!currentUserId) return;

  try {
    if (myAvailability.has(date)) {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('profile_id', currentUserId)
        .eq('date', date);

      if (error) throw error;

      myAvailability.delete(date);
    } else {
      const { error } = await supabase
        .from('availability')
        .insert({
          profile_id: currentUserId,
          date
        });

      if (error) throw error;

      myAvailability.add(date);
    }

    renderCalendar();
  } catch (err) {
    console.error('Availability error:', err);
  }
}

let currentDate = new Date();

function renderCalendar() {
  const container = document.getElementById('calendar');
  const label = document.getElementById('monthLabel');

  if (!container || !label) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  label.textContent = currentDate.toLocaleString('nl-BE', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const upcoming = allMatches.filter(isUpcomingMatch);

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const iso = formatISO(dateObj);

    const active = myAvailability.has(iso);

    const events = upcoming.filter(m =>
      new Date(m.Starts).toDateString() === dateObj.toDateString()
    );

    html += `
      <div class="day ${active ? 'active' : ''}" data-date="${iso}">
        <div class="day-number">${day}</div>

        <div class="events">
          ${events.map(e => `
            <div class="event match">
              ${e.Title}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll('.day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      toggleAvailability(el.dataset.date);
    });
  });
}

async function init() {
  try {
    const { data } = await supabase.auth.getUser();
    currentUserId = data?.user?.id;

    const [matches, registrations, availability] = await Promise.all([
      getMatches(),
      getMyRegistrations(),
      getAvailability(currentUserId)
    ]);

    allMatches = matches || [];
    myMatchIds = new Set(registrations);
    myAvailability = new Set((availability || []).map(a => a.date));

    renderMatches();
    renderCalendar();

    document.getElementById('prevMonth')?.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

  } catch (error) {
    console.error('Init error:', error);
  }
}

init();
import { getMatches, createMatch } from "../api/matches.js";
import { getAllProfiles } from "../api/users.js";
import {
  getMatchRegistrations,
  adminRegisterPlayer,
  adminUnregisterPlayer,
  updateReserveStatus,
} from "../api/registration.js";

const HOME_TEAM = 'HNO Assenede A';

let allMatches = [];
let allProfiles = [];
let currentMatchRegistrations = [];
let activeFilter = 'upcoming';
let currentAssignMatchId = null;

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

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function isUpcoming(match) {
  return match.Starts && new Date(match.Starts).getTime() > Date.now();
}

function renderMatches(matches) {
  const list = document.querySelector('#matches-list');
  if (!list) return;

  if (!matches.length) {
    list.innerHTML = '<p class="matches-empty">No matches found.</p>';
    return;
  }

  list.innerHTML = matches.map(match => {
    const home = isHome(match);
    const opponent = getOpponent(match);
    const badge = home
      ? '<span class="match-badge match-badge--home">Home</span>'
      : '<span class="match-badge match-badge--away">Away</span>';

    return `
      <div class="match-row" data-match-id="${match.id}">
        <div class="match-row__main">
          <div class="match-row__info">
            <div class="match-row__title">
              ${badge}
              <span class="match-row__opponent">vs ${opponent}</span>
            </div>
            <p class="match-row__date">${formatDateTime(match.Starts)}</p>
            <p class="match-row__location">${match.Location ?? ''}</p>
          </div>
          ${isUpcoming(match)
            ? `<button class="match-row__assign" data-assign-match-id="${match.id}">Assign players</button>`
            : ''}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-assign-match-id]').forEach(btn => {
    btn.addEventListener('click', () => openAssignModal(btn.dataset.assignMatchId));
  });
}

function applyFilter(filter) {
  activeFilter = filter;

  document.querySelectorAll('.filter-buttons').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  const filtered = filter === 'upcoming'
    ? allMatches.filter(isUpcoming)
    : allMatches.filter(m => !isUpcoming(m));

  renderMatches(filtered);
}

function setupFilters() {
  document.querySelectorAll('.filter-buttons').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });
}

function openModal() {
  document.querySelector('#create-match-modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.querySelector('#create-match-modal').hidden = true;
  document.body.style.overflow = '';
  document.querySelector('#match-form').reset();
}

function setupModal() {
  document.querySelector('#open-create-modal')?.addEventListener('click', openModal);

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeAssignModal(); }
  });

  document.querySelector('#match-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleCreateMatch();
  });
}

async function handleCreateMatch() {
  const saveBtn = document.querySelector('#save-match-btn');
  const versus = document.querySelector('#input-versus').value.trim();
  const starts = document.querySelector('#input-starts').value;
  const location = document.querySelector('#input-location').value.trim();
  const home = document.querySelector('#input-home').value;
  const maxPlayers = document.querySelector('#input-max-players').value;

  if (!versus || !starts) {
    alert('Opponent and date are required.');
    return;
  }

  const isHomeMatch = home === 'home';
  const title = isHomeMatch
    ? `${HOME_TEAM} / ${versus}`
    : `${versus} / ${HOME_TEAM}`;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    const newMatch = await createMatch({
      Title: title,
      Location: location || 'VBS Het Ooievaartnest, Leegstraat 19, 9960 Assenede',
      Starts: new Date(starts).toISOString(),
      Max_players: maxPlayers ? Number(maxPlayers) : null,
      Home: isHomeMatch,
    });

    if (!newMatch) throw new Error('Failed to create match');

    allMatches.unshift(newMatch);
    applyFilter(activeFilter);
    closeModal();
  } catch (err) {
    console.error(err);
    alert('Failed to create match. Please try again.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save match';
  }
}

async function openAssignModal(matchId) {
  currentAssignMatchId = matchId;
  document.querySelector('#assign-modal').hidden = false;
  document.body.style.overflow = 'hidden';
  populatePlayerSelect();
  await refreshAssignedList();
}

function closeAssignModal() {
  const modal = document.querySelector('#assign-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  currentAssignMatchId = null;
}

function populatePlayerSelect() {
  const select = document.querySelector('#assign-player-select');
  select.innerHTML =
    '<option value="">— Select a player —</option>' +
    allProfiles.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name}</option>`).join('');
}

async function refreshAssignedList() {
  const registrations = await getMatchRegistrations(currentAssignMatchId);
  currentMatchRegistrations = registrations;

  const starters = registrations.filter(r => !r.reserve).length;
  const reserves = registrations.filter(r => r.reserve).length;
  document.querySelector('#assign-counts').textContent =
    `${starters} player${starters !== 1 ? 's' : ''} · ${reserves} reserve${reserves !== 1 ? 's' : ''}`;

  const list = document.querySelector('#assigned-list');

  if (!registrations.length) {
    list.innerHTML = '<p class="matches-empty">No players assigned yet.</p>';
    return;
  }

  list.innerHTML = registrations.map(reg => {
    const name = reg.profiles
  ? `${reg.profiles.first_name} ${reg.profiles.last_name}`
  : reg.profile_id;

    return `
      <div class="assigned-row" data-reg-id="${reg.id}">
        <span class="assigned-row__name">${name}</span>
        <label class="assigned-row__reserve">
          <input
            type="checkbox"
            class="reserve-toggle"
            data-reg-id="${reg.id}"
            ${reg.reserve ? 'checked' : ''}
          />
          Reserve
        </label>
        <button class="assigned-row__remove btn-secondary" data-reg-id="${reg.id}">Remove</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.reserve-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      checkbox.disabled = true;
      try {
        await updateReserveStatus(checkbox.dataset.regId, checkbox.checked);
        await refreshAssignedList();
      } catch {
        checkbox.checked = !checkbox.checked;
        checkbox.disabled = false;
      }
    });
  });

  list.querySelectorAll('.assigned-row__remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Removing…';
      try {
        await adminUnregisterPlayer(btn.dataset.regId);
        await refreshAssignedList();
      } catch {
        btn.disabled = false;
        btn.textContent = 'Remove';
      }
    });
  });
}

function setupAssignModal() {
  document.querySelectorAll('[data-close-assign-modal]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) closeAssignModal();
    });
  });

  document.querySelector('#assign-add-btn')?.addEventListener('click', async () => {
    const select = document.querySelector('#assign-player-select');
    const profileId = select.value;
    const reserve = document.querySelector('#assign-reserve-checkbox').checked;

    if (!profileId) { alert('Please select a player.'); return; }

    const alreadyAssigned = currentMatchRegistrations.find(r => r.profile_id === profileId);
    if (alreadyAssigned) {
      const name = alreadyAssigned.profiles
        ? `${alreadyAssigned.profiles.first_name} ${alreadyAssigned.profiles.last_name}`
        : profileId;
      alert(`${name} is already assigned to this match.`);
      return;
    }

    const addBtn = document.querySelector('#assign-add-btn');
    addBtn.disabled = true;
    addBtn.textContent = 'Adding…';

    try {
      await adminRegisterPlayer(currentAssignMatchId, profileId, reserve);
      select.value = '';
      document.querySelector('#assign-reserve-checkbox').checked = false;
      await refreshAssignedList();
    } catch {
      alert('Failed to add player. They may already be assigned.');
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = 'Add';
    }
  });
}

async function init() {
  [allMatches, allProfiles] = await Promise.all([getMatches(), getAllProfiles()]);
  applyFilter('upcoming');
  setupFilters();
  setupModal();
  setupAssignModal();
}

init();
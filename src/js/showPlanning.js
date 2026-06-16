import { getMatches } from "../api/matches.js";
import {
  getMyRegistrations,
  registerForMatch,
  unregisterFromMatch,
} from "../api/registration.js";

const HOME_TEAM = 'HNO Assenede A';

let allMatches = [];
let myMatchIds = new Set();

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
  const matchDate = new Date(match.Starts);
  const now = new Date();
  return matchDate > now;
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
      <p class="match-date">${formatMatchDate(match.Starts)} ${matchType(match)}</p>
      <div class="match-actions">
        <button class="match-btn match-btn--primary" data-register-match-id="${match.id}" data-reserve="false" type="button">
          Ik ben beschikbaar
        </button>
        <button class="match-btn match-btn--secondary" data-register-match-id="${match.id}" data-reserve="true" type="button">
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
      <p class="match-date">${formatMatchDate(match.Starts)} ${matchType(match)}</p>
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

  const upcomingMatches = allMatches.filter(isUpcomingMatch);
  const available = upcomingMatches.filter(match => !myMatchIds.has(match.id));
  const mine = upcomingMatches.filter(match => myMatchIds.has(match.id));

  availableList.innerHTML = available.length
    ? available.map(availableMatchRow).join('')
    : '<p class="matches-empty">Geen beschikbare matchen gevonden.</p>';

  myList.innerHTML = mine.length
    ? mine.map(myMatchRow).join('')
    : '<p class="matches-empty">Je hebt nog geen komende matchen.</p>';

  availableList.querySelectorAll('[data-register-match-id]').forEach(button => {
    button.addEventListener('click', async () => {
      await handleRegister(button.dataset.registerMatchId, button.dataset.reserve === 'true');
    });
  });

  myList.querySelectorAll('[data-cancel-match-id]').forEach(button => {
    button.addEventListener('click', async () => {
      await handleCancel(button.dataset.cancelMatchId);
    });
  });
}

async function handleRegister(matchId, reserve) {
  try {
    await registerForMatch(matchId, reserve);
    const registrations = await getMyRegistrations();
    myMatchIds = new Set(registrations);
    renderMatches();
  } catch (error) {
    console.error('Could not register for match:', error);
    alert('Kon je beschikbaarheid niet opslaan.');
  }
}

async function handleCancel(matchId) {
  try {
    await unregisterFromMatch(matchId);
    const registrations = await getMyRegistrations();
    myMatchIds = new Set(registrations);
    renderMatches();
  } catch (error) {
    console.error('Could not cancel match availability:', error);
    alert('Kon je beschikbaarheid niet annuleren.');
  }
}

async function init() {
  try {
    const [matches, registrations] = await Promise.all([
      getMatches(),
      getMyRegistrations(),
    ]);

    allMatches = matches || [];
    myMatchIds = new Set(registrations);
    renderMatches();
  } catch (error) {
    console.error('Could not load matches:', error);
    document.querySelector('#available-matches').innerHTML =
      '<p class="matches-empty">Kon de matchen niet laden.</p>';
  }
}

init();

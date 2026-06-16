import { createMatch, deleteMatch, getMatches, updateMatch } from "../api/matches.js";

const HOME_TEAM = "HNO Assenede A";
const DEFAULT_LOCATION = "VBS Het Ooievaartnest, Leegstraat 19, 9960 Assenede";

let matches = [];
let selectedMatch = null;

const elements = {
  list: document.querySelector("#admin-match-list"),
  date: document.querySelector("#admin-match-date"),
  time: document.querySelector("#admin-match-time"),
  opponent: document.querySelector("#admin-match-opponent"),
  location: document.querySelector("#admin-match-location"),
  home: document.querySelector("#admin-match-home"),
  saveButton: document.querySelector("#admin-save-match"),
};

function isHome(match) {
  return match?.Title?.startsWith(HOME_TEAM);
}

function getOpponent(match) {
  const title = match?.Title ?? "";
  return title
    .replace(`${HOME_TEAM} / `, "")
    .replace(` / ${HOME_TEAM}`, "")
    .trim();
}

function formatMatchDate(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}u${minutes}`;
}

function setDateTimeInputs(isoString) {
  if (!isoString) {
    if (elements.date) elements.date.value = "";
    if (elements.time) elements.time.value = "";
    return;
  }

  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (elements.date) elements.date.value = `${year}-${month}-${day}`;
  if (elements.time) elements.time.value = `${hours}:${minutes}`;
}

function renderMatches() {
  if (!elements.list) return;

  if (!matches.length) {
    elements.list.innerHTML = '<p class="planning-empty-state">Geen matchen gevonden.</p>';
    return;
  }

  elements.list.innerHTML = matches.map((match) => `
    <article class="admin-match-row ${selectedMatch?.id === match.id ? "active" : ""}" data-match-id="${match.id}">
      <button class="admin-match-main" type="button">
        <span class="planning-opponent-mark" aria-hidden="true">↔</span>
        <span>vs</span>
        <img src="../assets/images/HNO_Assenede_logo.png" alt="">
        <span>${formatMatchDate(match.Starts)} ${isHome(match) ? "thuismatch" : "uitmatch"}</span>
      </button>
      <button class="match-delete-btn" type="button" data-delete-match="${match.id}">Match verwijderen</button>
      <button class="match-update-btn" type="button" data-edit-match="${match.id}">Match bijwerken</button>
    </article>
  `).join("");

  elements.list.querySelectorAll("[data-match-id] .admin-match-main, [data-edit-match]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("[data-match-id]");
      selectMatch(matches.find((match) => match.id === Number(row.dataset.matchId)));
    });
  });

  elements.list.querySelectorAll("[data-delete-match]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const match = matches.find((item) => item.id === Number(button.dataset.deleteMatch));
      if (!match) return;

      const confirmed = window.confirm(`Match tegen "${getOpponent(match)}" verwijderen?`);
      if (!confirmed) return;

      const deleted = await deleteMatch(match.id);
      if (!deleted) {
        alert("Match verwijderen is niet gelukt.");
        return;
      }

      matches = matches.filter((item) => item.id !== match.id);
      selectMatch(null);
      renderMatches();
    });
  });
}

function selectMatch(match) {
  selectedMatch = match ?? null;

  setDateTimeInputs(selectedMatch?.Starts);
  if (elements.opponent) elements.opponent.value = selectedMatch ? getOpponent(selectedMatch) : "";
  if (elements.location) elements.location.value = selectedMatch?.Location || "";
  if (elements.home) elements.home.value = selectedMatch && !isHome(selectedMatch) ? "away" : "home";
  if (elements.saveButton) elements.saveButton.textContent = selectedMatch ? "Match bijwerken" : "Voeg match toe";

  renderMatches();
}

function buildMatchPayload() {
  const opponent = elements.opponent?.value.trim();
  const date = elements.date?.value;
  const time = elements.time?.value;
  const location = elements.location?.value.trim();
  const home = elements.home?.value !== "away";

  if (!opponent || !date || !time) {
    alert("Vul minstens datum, uur en tegenstander in.");
    return null;
  }

  const starts = new Date(`${date}T${time}`);
  const title = home
    ? `${HOME_TEAM} / ${opponent}`
    : `${opponent} / ${HOME_TEAM}`;

  return {
    Title: title,
    Starts: starts.toISOString(),
    Location: location || (home ? DEFAULT_LOCATION : ""),
    Home: home,
  };
}

async function saveMatch() {
  const payload = buildMatchPayload();
  if (!payload) return;

  elements.saveButton.disabled = true;
  elements.saveButton.textContent = "Opslaan...";

  try {
    const savedMatch = selectedMatch
      ? await updateMatch(selectedMatch.id, payload)
      : await createMatch(payload);

    if (!savedMatch) throw new Error("Match could not be saved.");

    const index = matches.findIndex((match) => match.id === savedMatch.id);
    if (index >= 0) {
      matches[index] = savedMatch;
    } else {
      matches.unshift(savedMatch);
    }

    matches.sort((a, b) => new Date(a.Starts) - new Date(b.Starts));
    selectMatch(savedMatch);
  } catch (error) {
    console.error(error);
    alert("Match opslaan is niet gelukt.");
  } finally {
    elements.saveButton.disabled = false;
    elements.saveButton.textContent = selectedMatch ? "Match bijwerken" : "Voeg match toe";
  }
}

async function initPlanningAdmin() {
  if (!elements.list) return;

  matches = await getMatches().catch(() => []);
  elements.saveButton?.addEventListener("click", saveMatch);

  selectMatch(null);
}

initPlanningAdmin();

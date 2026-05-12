import { getMatches, createMatch } from "../api/matches.js";

const HOME_TEAM = 'HNO Assenede A';

let allMatches = [];
let activeFilter = 'upcoming';

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
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function isUpcoming(match) {
    if (!match.Starts) return false;

    const matchDate = new Date(match.Starts);
    const now = new Date();

    return matchDate.getTime() > now.getTime();
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
                    <button class="match-row__assign">Assign players</button>
                </div>
            </div>
        `;
    }).join('');
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
        if (e.key === 'Escape') closeModal();
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
            Location: location || null,
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

async function init() {
    allMatches = await getMatches();
    applyFilter('upcoming');
    setupFilters();
    setupModal();
}

init();
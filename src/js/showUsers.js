import { getUsers } from "../api/users.js";
import { getAvailability } from "../api/availability.js";

let allUsers = [];

function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function renderMiniCalendar(container, availableDates, year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const monthLabel = new Date(year, month).toLocaleString('default', {
        month: 'long', year: 'numeric'
    });

    container.innerHTML = `
        <div class="mini-cal">
            <div class="mini-cal__nav">
                <button class="mini-cal__arrow" data-dir="-1" aria-label="Previous month">‹</button>
                <span class="mini-cal__month">${monthLabel}</span>
                <button class="mini-cal__arrow" data-dir="1" aria-label="Next month">›</button>
            </div>
            <div class="mini-cal__grid">
                ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d =>
                    `<span class="mini-cal__weekday">${d}</span>`
                ).join('')}
                ${Array(firstDay).fill('<span class="mini-cal__empty"></span>').join('')}
                ${Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = formatDateKey(year, month, day);
                    const isAvailable = availableDates.has(dateStr);
                    return `<span class="mini-cal__day${isAvailable ? ' mini-cal__day--on' : ''}">${day}</span>`;
                }).join('')}
            </div>
        </div>
    `;

    container.querySelectorAll('.mini-cal__arrow').forEach(btn => {
        btn.addEventListener('click', () => {
            let m = month + parseInt(btn.dataset.dir);
            let y = year;
            if (m < 0) { m = 11; y--; }
            if (m > 11) { m = 0; y++; }
            renderMiniCalendar(container, availableDates, y, m);
        });
    });
}

function renderUsers(users) {
    const list = document.querySelector('.users__list');
    if (!list) return;

    if (!users.length) {
        list.innerHTML = '<p class="empty-state">No users found.</p>';
        return;
    }

    list.innerHTML = users.map(user => `
        <div class="user-row" data-user-id="${user.id}">
            <div class="user-row__summary">
                <span class="user-row__name">${user.first_name} ${user.last_name}</span>
                <button class="user-row__toggle" aria-expanded="false">
                    Check availability
                </button>
            </div>
            <div class="user-row__availability" hidden>
                <p class="availability__loading">Loading…</p>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.user-row__toggle').forEach(btn => {
        btn.addEventListener('click', () => handleToggle(btn));
    });
}

async function handleToggle(btn) {
    const row = btn.closest('.user-row');
    const panel = row.querySelector('.user-row__availability');
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Check availability';
        panel.hidden = true;
        return;
    }

    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = 'Hide availability';
    panel.hidden = false;

    if (panel.dataset.loaded) return;
    panel.dataset.loaded = 'true';

    const userId = row.dataset.userId;
    const availability = await getAvailability(userId);
    const availableDates = new Set(availability.map(r => r.date));

    if (!availability.length) {
        panel.innerHTML = '<p class="availability__empty">No availability set.</p>';
        return;
    }

    const calContainer = document.createElement('div');
    panel.innerHTML = '';
    panel.appendChild(calContainer);

    const now = new Date();
    renderMiniCalendar(calContainer, availableDates, now.getFullYear(), now.getMonth());
}

function setupSearch() {
    const input = document.querySelector('#search-input');
    const searchBtn = document.querySelector('#search-btn');
    const allTab = document.querySelector('#tab-all');
    const weekTab = document.querySelector('#tab-week');

    function applySearch() {
        const query = input?.value.trim().toLowerCase() ?? '';
        renderUsers(allUsers.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(query)
        ));
    }

    searchBtn?.addEventListener('click', applySearch);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') applySearch(); });

    allTab?.addEventListener('click', () => {
        allTab.classList.add('filter-tab--active');
        weekTab?.classList.remove('filter-tab--active');
        if (input) input.value = '';
        renderUsers(allUsers);
    });
    
    weekTab?.addEventListener('click', async () => {
        weekTab.classList.add('filter-tab--active');
        allTab?.classList.remove('filter-tab--active');
        renderUsers(await getUsersAvailableThisWeek());
    });
}

async function getUsersAvailableThisWeek() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const results = await Promise.all(
        allUsers.map(async user => {
            const availability = await getAvailability(user.id);
            const hasThisWeek = availability.some(entry => {
                const d = new Date(entry.date);
                return d >= weekStart && d <= weekEnd;
            });
            return hasThisWeek ? user : null;
        })
    );

    return results.filter(Boolean);
}

async function init() {
    allUsers = await getUsers() ?? [];
    renderUsers(allUsers);
    setupSearch();
}

init();
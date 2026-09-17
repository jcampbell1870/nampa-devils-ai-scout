const seededProspects = window.NAMPA_DEVILS_SEEDED_PROSPECTS || [];
const apiBaseUrl = (window.NAMPA_DEVILS_CONFIG?.apiBaseUrl || '').replace(/\/$/, '');

const state = {
  prospects: [...seededProspects],
  source: 'seeded local data',
  search: '',
  position: '',
  sort: 'desc'
};

const searchInput = document.querySelector('#search');
const positionSelect = document.querySelector('#position');
const sortSelect = document.querySelector('#sort');
const list = document.querySelector('#prospect-list');
const dataMode = document.querySelector('#data-mode');

const scoreLabels = [
  ['skating', 'Skating'],
  ['hockeyIQ', 'Hockey IQ'],
  ['competeLevel', 'Compete'],
  ['physicalTools', 'Physical'],
  ['projectability', 'Projectability'],
  ['coachability', 'Coachability']
];

function renderPositionOptions(items) {
  const positions = [...new Set(items.map((item) => item.position))].sort();
  positions.forEach((position) => {
    const option = document.createElement('option');
    option.value = position;
    option.textContent = position;
    positionSelect.append(option);
  });
}

function getFilteredData() {
  let items = [...state.prospects];

  if (state.position) {
    items = items.filter((item) => item.position === state.position);
  }

  if (state.search) {
    const needle = state.search.toLowerCase();
    items = items.filter((item) =>
      [item.name, item.currentLeagueTeam, item.location, item.position]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }

  return items.sort((a, b) =>
    state.sort === 'asc'
      ? a.fitScores.overallFit - b.fitScores.overallFit
      : b.fitScores.overallFit - a.fitScores.overallFit
  );
}

function renderProspects() {
  const items = getFilteredData();
  dataMode.textContent = `Viewing ${items.length} prospects (${state.source}).`;

  if (items.length === 0) {
    list.innerHTML = '<article class="panel">No prospects match this filter.</article>';
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const scoreRows = scoreLabels
        .map(([key, label]) => `<div>${label}: <strong>${item.fitScores[key]}</strong></div>`)
        .join('');

      const sources = item.sourceUrls
        .map((url) => `<li><a href="${url}" target="_blank" rel="noreferrer">${url}</a></li>`)
        .join('');

      return `
        <article class="card">
          <h3>${item.name} (${item.position})</h3>
          <p class="meta">${item.currentLeagueTeam}</p>
          <p class="meta">${item.location} · Age ${item.age} (Born ${item.birthYear})</p>
          <p class="meta">${item.height || 'Height unknown'} · ${item.weight || 'Weight unknown'}</p>
          <span class="fit-pill">Overall Nampa Fit: ${item.fitScores.overallFit}</span>
          <div class="score-grid">${scoreRows}</div>
          <details>
            <summary>Scouting details</summary>
            <p><strong>Notes:</strong> ${item.scoutingNotes}</p>
            <p><strong>Strengths:</strong> ${item.strengths.join(', ')}</p>
            <p><strong>Development concerns:</strong> ${item.developmentConcerns.join(', ')}</p>
            <strong>Sources:</strong>
            <ul>${sources}</ul>
          </details>
        </article>
      `;
    })
    .join('');
}

async function tryLoadApiData() {
  const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/prospects` : '/api/prospects';

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const body = await response.json();
    if (!Array.isArray(body.data)) {
      throw new Error('Unexpected API response shape.');
    }

    state.prospects = body.data;
    state.source = `Render/API data (${endpoint})`;
  } catch (_error) {
    state.source = 'seeded local data (API unavailable)';
  }

  renderProspects();
}

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderProspects();
});

positionSelect.addEventListener('change', (event) => {
  state.position = event.target.value;
  renderProspects();
});

sortSelect.addEventListener('change', (event) => {
  state.sort = event.target.value;
  renderProspects();
});

renderPositionOptions(state.prospects);
renderProspects();
void tryLoadApiData();

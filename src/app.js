const express = require('express');
const cors = require('cors');
const { prospects } = require('./data/prospects');

const app = express();

const parseCorsOrigins = (originsRaw) => {
  if (!originsRaw || originsRaw === '*') {
    return '*';
  }

  const origins = originsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : '*';
};

app.use(
  cors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    methods: ['GET', 'POST', 'OPTIONS']
  })
);
app.use(express.json({ limit: '100kb' }));

const positions = [...new Set(prospects.map((prospect) => prospect.position))].sort();

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nampa-devils-ai-scout-backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/prospects', (req, res) => {
  const { search, position, sort = 'desc' } = req.query;

  if (position && !positions.includes(position)) {
    return res.status(400).json({
      error: 'Invalid position filter',
      allowedPositions: positions
    });
  }

  if (!['asc', 'desc'].includes(sort)) {
    return res.status(400).json({
      error: 'Invalid sort query value. Use asc or desc.'
    });
  }

  let filtered = prospects;

  if (position) {
    filtered = filtered.filter((prospect) => prospect.position === position);
  }

  if (typeof search === 'string' && search.trim()) {
    const needle = search.trim().toLowerCase();
    filtered = filtered.filter((prospect) => {
      const haystack = [
        prospect.name,
        prospect.location,
        prospect.currentLeagueTeam,
        prospect.position
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }

  const sorted = [...filtered].sort((a, b) => {
    const delta = a.fitScores.overallFit - b.fitScores.overallFit;
    return sort === 'asc' ? delta : -delta;
  });

  return res.json({
    count: sorted.length,
    filters: {
      search: search || '',
      position: position || null,
      sort
    },
    data: sorted
  });
});

app.post('/api/research/prospect', (req, res) => {
  const { playerName, context } = req.body ?? {};

  if (typeof playerName !== 'string' || !playerName.trim()) {
    return res.status(400).json({
      error: 'playerName is required and must be a non-empty string.'
    });
  }

  const provider = process.env.AI_RESEARCH_PROVIDER || 'not-configured';

  return res.status(501).json({
    status: 'not_implemented',
    message:
      'AI-assisted research provider integration is a documented placeholder. Configure provider credentials in Render environment variables before enabling live calls.',
    playerName: playerName.trim(),
    context: typeof context === 'string' ? context.trim() : '',
    provider,
    hasApiKeyConfigured: Boolean(process.env.AI_RESEARCH_API_KEY)
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  const statusCode = Number.isInteger(err.status) ? err.status : 500;

  res.status(statusCode).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = {
  app,
  positions
};

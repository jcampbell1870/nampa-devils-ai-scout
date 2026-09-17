const path = require('path');
const express = require('express');
const cors = require('cors');
const { prospects } = require('./data/prospects');

const app = express();
const frontendRoot = path.resolve(__dirname, '..', 'frontend');

const parseCorsOrigins = (originsRaw) => {
  const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const configured = (originsRaw || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin) => origin !== '*');

  return [...new Set([...defaults, ...configured])];
};

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin denied'));
    },
    methods: ['GET', 'POST', 'OPTIONS']
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(express.static(frontendRoot));

const positions = [...new Set(prospects.map((prospect) => prospect.position))].sort();

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

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
  const statusCode =
    Number.isInteger(err.status) ? err.status : err.message === 'CORS origin denied' ? 403 : 500;

  res.status(statusCode).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = {
  app,
  positions
};

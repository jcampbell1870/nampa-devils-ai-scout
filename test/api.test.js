const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../src/app');

test('GET /health returns service status', async () => {
  const response = await request(app).get('/health').expect(200);

  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'nampa-devils-ai-scout-backend');
  assert.ok(response.body.timestamp);
});

test('GET / serves the dashboard HTML', async () => {
  const response = await request(app).get('/').expect(200);

  assert.match(response.headers['content-type'], /text\/html/);
  assert.match(response.text, /<title>Nampa Devils AI Scout<\/title>/);
});

test('GET /api/prospects returns prospect list', async () => {
  const response = await request(app).get('/api/prospects').expect(200);

  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.length >= 1);
  assert.equal(response.body.data[0].fitScores.overallFit >= response.body.data.at(-1).fitScores.overallFit, true);
});

test('GET /api/prospects rejects invalid position filter', async () => {
  const response = await request(app).get('/api/prospects?position=INVALID').expect(400);

  assert.equal(response.body.error, 'Invalid position filter');
  assert.ok(Array.isArray(response.body.allowedPositions));
});

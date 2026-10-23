const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');

test('GET /health returns 200 with status and uptime', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body).sort(), ['status', 'uptime'].sort());
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.uptime, 'number');
  assert.ok(res.body.uptime >= 0);
});

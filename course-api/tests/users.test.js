const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const store = require('../db/store');

test.beforeEach(() => store.reset());

test('GET /users returns the seeded list', async () => {
  const res = await request(app).get('/users');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 2);
});

test('GET /users/:id returns 404 for a missing user', async () => {
  const res = await request(app).get('/users/999');
  assert.equal(res.status, 404);
});

test('POST /users creates a user', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'Grace Hopper', email: 'grace@example.com' });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, 'Grace Hopper');
  assert.ok(res.body.id);
});

test('PUT /users/:id updates an existing user', async () => {
  const res = await request(app).put('/users/1').send({ name: 'Ada L.' });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Ada L.');
});

test('PUT /users/:id returns 404 for a missing user', async () => {
  const res = await request(app).put('/users/999').send({ name: 'Nobody' });
  assert.equal(res.status, 404);
});

test('GET /users/:id with non-numeric id returns 400', async () => {
  const res = await request(app).get('/users/abc');
  assert.equal(res.status, 400);
});

test('POST /users with missing name returns 400', async () => {
  const res = await request(app)
    .post('/users')
    .send({ email: 'a@b.com' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /users with missing email returns 400', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'Alice' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /users with whitespace-only name returns 400', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: '   ', email: 'a@b.com' });
  assert.equal(res.status, 400);
});

test('POST /users with non-JSON body returns 400', async () => {
  const res = await request(app)
    .post('/users')
    .set('Content-Type', 'text/plain')
    .send('plain text');
  assert.equal(res.status, 400);
});

test('PUT /users/:id with non-numeric id returns 400', async () => {
  const res = await request(app)
    .put('/users/abc')
    .send({ name: 'Updated' });
  assert.equal(res.status, 400);
});

test('PUT /users/:id with empty-string name returns 400', async () => {
  const res = await request(app)
    .put('/users/1')
    .send({ name: '' });
  assert.equal(res.status, 400);
});

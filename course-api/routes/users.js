const express = require('express');
const store = require('../db/store');

const router = express.Router();

// GET /users — list all users.
router.get('/', (req, res) => {
  res.json(store.listUsers());
});

// GET /users/:id — fetch one user, or 404 if it doesn't exist.
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  const user = store.getUser(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

// POST /users — create a user. Requires name and email.
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const user = store.createUser({ name, email });
  return res.status(201).json(user);
});

// PUT /users/:id — update an existing user (added in Project 2).
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  const { name, email } = req.body;
  if (name === undefined && email === undefined) {
    return res.status(400).json({ error: 'name or email is required' });
  }
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'name must not be empty' });
  }
  if (email !== undefined && !email.trim()) {
    return res.status(400).json({ error: 'email must not be empty' });
  }
  const user = store.updateUser(id, { name, email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

module.exports = router;

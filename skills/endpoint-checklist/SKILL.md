---
name: endpoint-checklist
description: Use when adding, changing, or removing an HTTP API endpoint or route — "add a DELETE /users/:id endpoint", "add a new resource", "change what the PUT handler returns". Walks through routing, validation, status codes, data access, docs, and tests so the change ships complete.
---

# Endpoint checklist

Use this checklist whenever an API endpoint is added, changed, or removed. Most quality bugs in a small API come from a step that was skipped: a missing `400`, a route that isn't mounted, docs that no longer match, a branch with no test. Work through every section before calling the change done.

**Read the project's `CLAUDE.md` first.** Its conventions override the defaults below. The defaults describe a typical Express app with one router per resource, a data-access module, and JSON errors.

## 1. Route

- [ ] The handler lives in the router file for its resource (e.g. `routes/users.js`). A new resource gets a new router file.
- [ ] A new router is mounted in the entry point (e.g. `app.use('/widgets', widgetsRouter)` in `server.js`) under its base path.
- [ ] The method matches the action: `GET` reads, `POST` creates, `PUT`/`PATCH` updates, `DELETE` removes.
- [ ] Above the handler there's a one-line comment in the file's existing style, e.g. `// DELETE /users/:id — remove a user, or 404 if it doesn't exist.`

## 2. Input validation

- [ ] Path params are converted and checked. `Number(req.params.id)` on `"abc"` gives `NaN`, so decide what that should return (usually `400` or `404`) instead of passing `NaN` on.
- [ ] Required body fields are present. Return `400` if not.
- [ ] Body fields have the right **type**, not just presence: `null`, numbers where strings are expected, and empty strings are the usual gaps.
- [ ] Unknown or extra fields are ignored. Never spread `req.body` straight into stored data.

## 3. Data access

- [ ] All reads and writes go through the data module (e.g. `db/store.js`). The route never holds state itself.
- [ ] If the endpoint needs a new operation (e.g. `deleteUser`), add it to the data module and export it, and make `reset()`/seed still restore a clean state for tests.
- [ ] Return copies, not internal references, wherever a caller could change what it gets back.

## 4. Responses

| Situation | Status | Body |
|-----------|--------|------|
| Read OK | `200` | the resource or a list of them |
| Created | `201` | the created resource |
| Deleted | `204` | empty |
| Bad input | `400` | `{ "error": "<what is wrong>" }` |
| Record missing | `404` | `{ "error": "<Thing> not found" }` |

- [ ] Every error path returns JSON in the project's error shape, with a message a client can act on.
- [ ] Every branch `return`s its response, so no handler can respond twice.

## 5. Docs

- [ ] The API reference (e.g. `docs/api.md`) has a section for the endpoint: method and path, body fields, and **every** status code it can return.
- [ ] If an existing endpoint changed, its docs changed in the same edit.

## 6. Tests

Add one test per behaviour, following the existing test file's setup (e.g. `beforeEach(() => store.reset())`):

- [ ] the success case, checking the status **and** the body;
- [ ] each `400` case (each missing or invalid field);
- [ ] the `404` case;
- [ ] for writes, a follow-up read that proves the change persisted (or, for a delete, that the record is gone).

Then run the test command and the lint command. Both must pass before the change is done.

## Done when

- [ ] All boxes above are ticked.
- [ ] Tests and lint pass.
- [ ] Your summary of the change lists the endpoint, its status codes, and the tests added.

To review the finished change with this plugin, run `/code-quality:audit <path>`.

---
description: Full code-quality pass. Two parallel reviews and a baseline test/lint run, then fill test gaps and verify against the baseline.
argument-hint: "[path]"
---

Run a code-quality audit as a workflow of subagents. Follow these steps in order. A step marked **parallel** launches all of its parts in a single message so they run at the same time. A step marked **waits for** must not start until those earlier results are in.

## Scope

- **Target:** `$ARGUMENTS`. If that is empty, audit the whole project.
- **Project root:** the directory with the `package.json` (or equivalent manifest). If the target is a directory with its own manifest, that directory is the root. Otherwise use the nearest manifest at or above the target. Run every command from the project root.
- Read the root's `CLAUDE.md`, if it has one, before starting. Pass its conventions on to every subagent.

## Step 1: Review and measure (parallel)

Launch these three at once. None of them depends on another.

- **A. `code-reviewer` subagent, request-handling layer.** Review the files that receive input and return responses (routes, controllers, handlers, middleware) within the target.
- **B. `code-reviewer` subagent, everything else.** Review the data layer, app entry point and configuration within the target, plus any API docs, and check that the docs match the code.
- **C. Baseline (do this yourself while A and B run).** Run the project's test command and lint command (from `package.json` scripts, e.g. `npm test` and `npm run lint`). Record the pass/fail/todo counts, the lint errors and warnings, and the names of any failing tests.

If the target is a single file or too small to split, run just one reviewer (A) on it. Still run C alongside it.

Tell each reviewer which files are in its half, so A and B don't overlap.

## Step 2: Merge the reviews (waits for A, B and C)

- Combine the two **Findings** tables into one. Merge duplicates (same location, same problem), sort by severity (high → low), and renumber.
- Combine the two **Untested behaviour** lists into one list without duplicates.
- If the baseline in C had failing tests, keep their names aside as **pre-existing failures**, so they aren't blamed on new tests later.

If the merged untested list says "None.", skip Step 3 and go straight to Step 4.

## Step 3: Fill the test gaps (waits for Step 2)

Launch **one `test-writer` subagent** and give it:
- the merged **Untested behaviour** list, verbatim;
- the project root and test command;
- the list of pre-existing failures, telling it to leave those tests alone.

Use only one writer. Several writers would edit the same test files at once and overwrite each other's changes.

## Step 4: Verify (waits for Step 3)

Re-run the same test and lint commands as in C, and compare with the baseline:
- tests: passed / failed / todo, before → after;
- lint: errors / warnings, before → after.

A test that passed in C and fails now is a **regression**. Report it at the top of the final report. Don't try to fix it.

## Step 5: Report

Reply with this report and nothing after it:

```
# Audit: <target or "whole project">

## Verdict
<one line: e.g. "3 high-severity findings, 6 tests added, no regressions">

## Findings
<merged findings table from Step 2>

## Tests added
<the test-writer's "Tests added" table, or "Skipped (no untested behaviour)">

## Bugs found by tests
<the test-writer's "Bugs found" list>

## Before → after
| Check | Baseline | After |
|-------|----------|-------|
| Tests passed / failed / todo | | |
| Lint errors / warnings | | |

## Still open
<pre-existing failures, regressions, and anything the test-writer listed under "Not covered", or "None.">
```

Don't change any source file yourself during the audit. Findings are reported, not fixed.

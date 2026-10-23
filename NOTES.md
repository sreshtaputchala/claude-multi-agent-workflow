# Notes: code-quality plugin

## What it does

`code-quality` gives Claude Code a repeatable quality pass over a JavaScript/Node codebase. It has five parts:

| Component | Name | What it does |
|-----------|------|--------------|
| Subagent | `code-quality:code-reviewer` | Read-only reviewer. Reports bugs, convention breaks, docs drift, and untested behaviour, each pinned to `file:line`. |
| Subagent | `code-quality:test-writer` | Writes tests in the project's existing style and runs them. Edits test files only. Marks real bugs as `todo` tests instead of "fixing" source. |
| Command | `/code-quality:audit [path]` | The workflow. Runs the two agents in order (see below) and ends with a findings table, the tests it added, the bugs it found, and before → after test/lint numbers. |
| Skill | `code-quality:endpoint-checklist` | Loads automatically when you add or change an API endpoint. Walks through routing, validation, status codes, data access, docs, and tests. |
| Hook | lint-on-edit (`PostToolUse`, `Edit\|Write`) | Runs the project's own ESLint on every `.js` file Claude edits and feeds errors back so Claude fixes them straight away. The script is referenced as `${CLAUDE_PLUGIN_ROOT}/hooks/lint-on-edit.js`. |

The skill **prevents** problems while code is written, the audit **finds** them afterwards, and the hook keeps every edit lint-clean in between, including the test writer's own edits.

## How to install

This repo is both the plugin and its marketplace (`sreshta-plugins`). In Claude Code:

```
/plugin marketplace add sreshtaputchala/claude-multi-agent-workflow
/plugin install code-quality@sreshta-plugins
```

If the short `owner/repo` form fails to clone, use the full URL:
`/plugin marketplace add https://github.com/sreshtaputchala/claude-multi-agent-workflow.git`

Then restart Claude Code or run `/reload-plugins`. To check it worked: `/agents` lists both `code-quality:` agents, `/hooks` lists the lint hook, and `/code-quality:audit course-api` (from the repo root) runs the workflow against the bundled sample API.

For local development, load the plugin straight from a checkout with `claude --plugin-dir .` and run `/reload-plugins` after each edit.

## Scoping decision: what the reviewer can't do, and why the test writer gets a cheaper model

**`code-reviewer`: `tools: Read, Grep, Glob` on `sonnet`.**
A reviewer's value depends on being trusted not to change what it reviews. With no `Edit`, `Write`, or `Bash`, it *can't* touch files or run commands, even by accident or because a file it reads tells it to. Its read-only status comes from its tool list, not from a sentence in a prompt. That also makes it safe to run two copies in parallel. It got the stronger model because finding a bug that *isn't* written down (a `NaN` id falling through to a `404`, `null` getting past an `=== undefined` check, `listUsers()` leaking the internal array) is the hardest reasoning in the plugin.

**`test-writer`: `tools: Read, Grep, Glob, Write, Edit, Bash` on `haiku`.**
It needs `Write`/`Edit` to create tests and `Bash` to run them. Without running them it couldn't tell a wrong test from a real bug. Its job is mostly pattern-following: copy the existing test file's setup and assertion style. `npm test` gives it an immediate, objective check, so a fast, cheap model is enough.

**The trade-off:** a subagent's `tools` line can't limit `Bash` to certain commands or `Edit` to certain folders. "Only run the test command" and "edit test files only" are instructions in the agent's body, not hard limits. I accepted that because the alternative (no `Bash`) makes the agent unable to check its own work. The hook and the audit's before → after check catch it if it goes wrong. During testing it kept to the rules: every audit run changed only files under `tests/`.

## Orchestration decision: what runs in parallel and what waits

```
Step 1  PARALLEL   code-reviewer A (routes) ‖ code-reviewer B (data, entry, docs) ‖ npm test + npm run lint
Step 2  waits      merge both reviews → one findings table + one "Behaviours to test" list
Step 3  waits      ONE test-writer gets that list
Step 4  waits      re-run tests + lint, compare with the Step 1 baseline
Step 5             report
```

**Why Step 1 runs in parallel.** None of the three parts needs another's output. The reviewers only read, so they can't conflict, and the baseline is only a measurement. Splitting the review by layer gives each reviewer less to read, so it reads more closely. In a measured run, both reviewers started within 3 s of each other and the test/lint baseline finished while they were still working. The whole step took about as long as the slower reviewer.

**Why the rest is sequential.** Each later step consumes the previous step's output:
- The merge needs *both* reviews before it can remove duplicates.
- The test writer needs the merged list. Started early, it would guess at what to test.
- The verify step needs the test writer's changes, and the Step 1 baseline is the only proof it improved things without breaking anything.

**Why there is only one writer, even though it's the slow step.** Writing tests could be split per module like the review was. But two writers would edit the same `tests/users.test.js` at the same time and overwrite each other. Reads can run in parallel; writes to shared files are kept sequential.

**What testing changed.** The first local run showed a flaw in the handoff. Step 2 passed the test writer only the "untested behaviour" list, and the writer was told to assert what the code *currently* does. So it wrote `GET /users/abc → 404` as a passing test, even though the reviewer had flagged that as a bug (it should be `400`). The audit was turning bugs into requirements. The fix had two parts. The merge step now also turns testable findings into "expected behaviour" items. The test writer now asserts intended behaviour (docs + conventions) and marks mismatches as `todo`. The second run surfaced 3 real bugs as `todo` tests: non-numeric ids on GET and PUT, and `PUT { "name": null }`. They were then fixed in `course-api` (see commit "Apply audit results to course-api").

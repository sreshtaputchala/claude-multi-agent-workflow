# code-quality

A Claude Code plugin that runs a code-quality workflow on a codebase. A read-only reviewer and a test-writing agent work together under one command, with an endpoint-checklist skill and a lint-on-edit hook alongside them.

> **Status:** v0.1.0. Published through this repo's marketplace (`sreshta-plugins`).

## Components

| Type     | Name                 | Location                              | Purpose                                                                 |
| -------- | -------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Subagent | `code-reviewer`      | `agents/code-reviewer.md`             | Read-only reviewer (Read, Grep, Glob; sonnet). Reports bugs, convention breaks, and untested behaviour |
| Subagent | `test-writer`        | `agents/test-writer.md`               | Writes and runs tests (haiku); edits test files only                    |
| Command  | `audit`              | `commands/audit.md`                   | The workflow: parallel reviews + baseline, then test-writer, then verify |
| Skill    | `endpoint-checklist` | `skills/endpoint-checklist/SKILL.md`  | Checklist Claude follows when adding or changing an API endpoint        |
| Hook     | lint-on-edit         | `hooks/hooks.json` → `hooks/lint-on-edit.js` | After every Edit/Write of a `.js` file, runs the project's ESLint on it and sends errors back to Claude |

Once the plugin is installed, every component is namespaced as `code-quality:<name>`. For example, the workflow command runs as `/code-quality:audit [path]`.

## Layout

```
.claude-plugin/
  plugin.json        # manifest: name + version (only manifest files live here)
agents/              # subagent definitions (*.md)
commands/            # slash commands (*.md)
skills/              # skills/<name>/SKILL.md
hooks/               # hooks.json (+ any bundled scripts)
course-api/          # sample Express API to test the plugin against
```

## Try it locally

```bash
cd course-api && npm install && cd ..
claude --plugin-dir .
```

After editing plugin files, run `/reload-plugins` in the session to pick up the changes.

## Install

This repo is also the plugin's marketplace, `sreshta-plugins` (see `.claude-plugin/marketplace.json`). In any Claude Code session:

```
/plugin marketplace add sreshtaputchala/claude-multi-agent-workflow
/plugin install code-quality@sreshta-plugins
```

Restart Claude Code (or run `/reload-plugins`), then check:

- `/agents` lists `code-quality:code-reviewer` and `code-quality:test-writer`
- `/hooks` lists the `PostToolUse` lint hook
- `/code-quality:audit [path]` runs the workflow

To update later, run `/plugin marketplace update sreshta-plugins`.

## Versioning

The version lives in `.claude-plugin/plugin.json` and follows semver. Bump it with every release.

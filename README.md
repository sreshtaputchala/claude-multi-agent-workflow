# code-quality

A Claude Code plugin that runs a code-quality workflow on a codebase. A read-only reviewer and a test-writing agent work together under one command, with a review skill and a lint hook alongside them.

> **Status:** scaffold (v0.1.0). The components below are being built. This table will be updated as each one lands.

## Components

| Type     | Location                    | Purpose                                                     |
| -------- | --------------------------- | ----------------------------------------------------------- |
| Subagent | `agents/`                   | Read-only code reviewer (Read, Grep, Glob only)              |
| Subagent | `agents/`                   | Test writer that can add and edit test files                 |
| Command  | `commands/`                 | Workflow that runs the subagents with parallel and dependent steps |
| Skill    | `skills/<name>/SKILL.md`    | Code-review conventions the agents and command follow        |
| Hook     | `hooks/hooks.json`          | Lint check after edits, using `${CLAUDE_PLUGIN_ROOT}` paths  |

Once the plugin is installed, every component is namespaced as `code-quality:<name>`. For example, the workflow command runs as `/code-quality:<command>`.

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

## Install from the marketplace

This repo will also be the plugin's marketplace (`.claude-plugin/marketplace.json`, added in a later step). When it's ready:

```
/plugin marketplace add sreshtaputchala/claude-multi-agent-workflow
/plugin install code-quality@<marketplace-name>
```

## Versioning

The version lives in `.claude-plugin/plugin.json` and follows semver. Bump it with every release.

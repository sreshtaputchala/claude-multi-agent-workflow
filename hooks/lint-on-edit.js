#!/usr/bin/env node
// PostToolUse hook: lint the JavaScript file Claude just edited or wrote.
//
// Reads the hook payload from stdin, finds the project that owns the file
// (nearest package.json), and runs that project's own ESLint on just that
// file. On lint errors it exits 2 so the output is fed back to Claude to fix.
// Anything it can't handle (non-JS file, no ESLint, no config) exits 0 quietly
// so the hook never gets in the way on unrelated projects.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const JS_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

function findProjectRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// Resolve the project's local ESLint CLI script, or null if it isn't installed.
function findEslintBin(root) {
  try {
    const pkgPath = require.resolve('eslint/package.json', { paths: [root] });
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin && pkg.bin.eslint;
    return bin ? path.join(path.dirname(pkgPath), bin) : null;
  } catch {
    return null;
  }
}

function main() {
  const payload = readStdin();
  const filePath = payload && payload.tool_input && payload.tool_input.file_path;
  if (!filePath || !JS_EXTENSIONS.has(path.extname(filePath))) return 0;

  const absFile = path.resolve(payload.cwd || process.cwd(), filePath);
  if (!fs.existsSync(absFile) || absFile.includes(`${path.sep}node_modules${path.sep}`)) return 0;

  const root = findProjectRoot(path.dirname(absFile));
  if (!root) return 0;

  const eslintBin = findEslintBin(root);
  if (!eslintBin) return 0;

  const result = spawnSync(process.execPath, [eslintBin, '--no-warn-ignored', absFile], {
    cwd: root,
    encoding: 'utf8',
  });

  // ESLint exits 0 for clean (or warnings only), 1 for lint errors, 2 for a
  // crash or missing config. Only real lint errors should block.
  if (result.status === 1) {
    const rel = path.relative(root, absFile);
    process.stderr.write(
      `ESLint found errors in ${rel}. Fix them before moving on:\n${result.stdout}${result.stderr}`
    );
    return 2;
  }
  return 0;
}

process.exit(main());

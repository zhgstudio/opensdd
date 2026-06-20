#!/usr/bin/env node
'use strict';

const path = require('path');
const filesCheck = require('./checks/files');
const planCheck = require('./checks/plan');
const matrixCheck = require('./checks/matrix');
const garbageCheck = require('./checks/garbage');
const agentsCheck = require('./checks/agents');
const frontmatterCheck = require('./checks/frontmatter');
const moduleContentCheck = require('./checks/module-content');
const interfaceConsistencyCheck = require('./checks/interface-consistency');
const { report } = require('./lib/reporter');
const { loadConfig } = require('./config');

function printHelp() {
  console.log(`
opensdd-check — Validate OpenSDD project structure

USAGE
  node index.js [options]

OPTIONS
  --path <dir>    Project root directory (default: current dir)
  --json          Output results as JSON
  --strict        Treat warnings as errors
  --help, -h      Show this help

CHECKS
  FILE_EXISTS           SPEC.md, ARCHITECTURE.md, PLAN.md, AGENTS.md presence
  PLAN_FORMAT           Task format validity in PLAN.md (with DESIGN.md references)
  DEP_MATRIX            Module directories (NN-name) exist with DESIGN.md for dependency matrix entries
  NO_GARBAGE            No _v2.md, _final.md, _tmp etc. versioned garbage files
  AGENTS_SECTIONS       Required sections present in AGENTS.md
  MODULE_CONTENT        API.md/DESIGN.md required sections and feature list
  API_CONSISTENCY       Cross-module interface signature matching

`);
}

function parseArgs(args) {
  const opts = { root: '.', json: false, strict: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--path':
        opts.root = args[++i] || '.';
        break;
      case '--json':
        opts.json = true;
        break;
      case '--strict':
        opts.strict = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return opts;
}

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  const resolvedRoot = path.resolve(opts.root);
  const config = loadConfig(resolvedRoot);

  const results = await Promise.all([
    filesCheck(resolvedRoot, config),
    planCheck(resolvedRoot, config),
    matrixCheck(resolvedRoot, config),
    garbageCheck(resolvedRoot, config),
    agentsCheck(resolvedRoot, config),
    frontmatterCheck(resolvedRoot, config),
    moduleContentCheck(resolvedRoot, config),
    interfaceConsistencyCheck(resolvedRoot, config),
  ]);

  const exitCode = report(results, { json: opts.json, strict: opts.strict, root: resolvedRoot });
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('opensdd-check error:', err.message);
  process.exit(1);
});

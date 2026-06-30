#!/usr/bin/env node
'use strict';

const path = require('path');
const filesCheck = require('./checks/files');
const planCheck = require('./checks/plan');
const matrixCheck = require('./checks/matrix');
const agentsCheck = require('./checks/agents');
const frontmatterCheck = require('./checks/frontmatter');
const moduleContentCheck = require('./checks/module-content');
const interfaceConsistencyCheck = require('./checks/interface-consistency');
const tbdResidualCheck = require('./checks/tbd-residual');
const versionConsistencyCheck = require('./checks/version-consistency');
const noTmpCheck = require('./checks/no-tmp');
const decisionsCheck = require('./checks/decisions');
const traceabilityCheck = require('./checks/traceability');
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
  FRONTMATTER           YAML frontmatter validity in skill .md files
  FILE_EXISTS           SPEC.md, ARCHITECTURE.md, PLAN.md, AGENTS.md presence
  PLAN_FORMAT           Task format validity in PLAN.md (with DESIGN.md references)
  DEP_MATRIX            Module directories (NN-name) exist with DESIGN.md for dependency matrix entries
  AGENTS_SECTIONS       Required sections present in AGENTS.md
  MODULE_CONTENT        API.md/DESIGN.md required sections and feature list
  API_CONSISTENCY       Cross-module interface signature matching
  TBD_RESIDUAL          No [TBD] markers remain in ARCHITECTURE.md
  VERSION_CONSISTENCY   SKILL.md version matches package.json versions
  NO_TMP                No tmp/ directories exist in the project
  DECISIONS_FORMAT      DECISIONS.md frontmatter validity (format only, no semantic section check)
  TRACEABILITY          Requirement-to-feature traceability (REQ-DOMAIN-NNN ↔ MODULE-FNNN, warn only)

`);
}

function parseArgs(args) {
  const opts = { root: '.', json: false, strict: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--path': {
        const next = args[++i];
        if (next === undefined || next.startsWith('-')) {
          opts.root = '.';
          console.warn('Warning: --path flag requires a directory argument, defaulting to current directory');
          if (next !== undefined) i--; // let the next iteration handle the flag
        } else {
          opts.root = next;
        }
        break;
      }
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

function main() {
  const opts = parseArgs(process.argv.slice(2));

  const resolvedRoot = path.resolve(opts.root);
  const config = loadConfig(resolvedRoot);

  const results = [
    filesCheck(resolvedRoot, config),
    planCheck(resolvedRoot, config),
    matrixCheck(resolvedRoot, config),
    agentsCheck(resolvedRoot, config),
    frontmatterCheck(resolvedRoot),
    moduleContentCheck(resolvedRoot, config),
    interfaceConsistencyCheck(resolvedRoot, config),
    tbdResidualCheck(resolvedRoot, config),
    versionConsistencyCheck(resolvedRoot),
    noTmpCheck(resolvedRoot),
    decisionsCheck(resolvedRoot),
    traceabilityCheck(resolvedRoot),
  ];

  const exitCode = report(results, { json: opts.json, strict: opts.strict, root: resolvedRoot });
  process.exit(exitCode);
}

try {
  main();
} catch (err) {
  const jsonMode = process.argv.includes('--json');
  if (jsonMode) {
    console.log(JSON.stringify({ error: err.message }));
  } else {
    console.error('opensdd-check error:', err.message);
  }
  process.exit(1);
}

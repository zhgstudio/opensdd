#!/usr/bin/env node
const path = require('path');
const filesCheck = require('./checks/files');
const planCheck = require('./checks/plan');
const matrixCheck = require('./checks/matrix');
const garbageCheck = require('./checks/garbage');
const agentsCheck = require('./checks/agents');
const { report } = require('./lib/reporter');

async function main() {
  const args = process.argv.slice(2);
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
        return;
    }
  }

  const resolvedRoot = path.resolve(opts.root);

  const results = await Promise.all([
    filesCheck(resolvedRoot),
    planCheck(resolvedRoot),
    matrixCheck(resolvedRoot),
    garbageCheck(resolvedRoot),
    agentsCheck(resolvedRoot),
  ]);

  const exitCode = report(results, { json: opts.json, strict: opts.strict });
  process.exit(exitCode);
}

function printHelp() {
  console.log(`
sdd-check — Validate 4+N SDD project structure

USAGE
  node index.js [options]

OPTIONS
  --path <dir>    Project root directory (default: current dir)
  --json          Output results as JSON
  --strict        Treat warnings as errors
  --help, -h      Show this help

CHECKS
  FILE_EXISTS     SPEC.md, ARCHITECTURE.md, PLAN.md, AGENTS.md presence
  PLAN_FORMAT     Task format validity in PLAN.md
  DEP_MATRIX      Module directories exist for dependency matrix entries
  NO_GARBAGE      No _v2.md, _final.md, _tmp etc. versioned garbage files
  AGENTS_SECTIONS Required sections present in AGENTS.md
`);
}

main().catch(err => {
  console.error('sdd-check error:', err.message);
  process.exit(1);
});

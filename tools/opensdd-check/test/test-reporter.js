'use strict';

const assert = require('assert');

async function run() {
  const { report } = require('../lib/reporter');

  // Test 1: All pass → exit code 0
  const passResults = [
    { name: 'FILE_EXISTS', status: 'pass', messages: ['All files ok'], _root: '/test' },
    { name: 'PLAN_FORMAT', status: 'pass', messages: ['5 tasks ok'], _root: '/test' },
  ];

  // Capture console.log
  const logs = [];
  const origLog = console.log;
  console.log = (...args) => {
    logs.push(args.join(' '));
  };

  let exitCode = report(passResults, { json: false, strict: false });
  console.log = origLog;

  assert.strictEqual(exitCode, 0, 'all pass should return 0');
  assert.ok(
    logs.some((l) => l.includes('PASSED')),
    'should show PASSED',
  );
  console.log('  PASS: all-pass report returns exit code 0');

  // Test 2: Any fail → exit code 1
  const failResults = [
    { name: 'FILE_EXISTS', status: 'fail', messages: ['Missing SPEC.md'], _root: '/test' },
    { name: 'PLAN_FORMAT', status: 'pass', messages: ['5 tasks ok'], _root: '/test' },
  ];

  const logs2 = [];
  console.log = (...args) => {
    logs2.push(args.join(' '));
  };

  exitCode = report(failResults, { json: false, strict: false });
  console.log = origLog;

  assert.strictEqual(exitCode, 1, 'any fail should return 1');
  assert.ok(
    logs2.some((l) => l.includes('FAILED')),
    'should show FAILED',
  );
  console.log('  PASS: fail report returns exit code 1');

  // Test 3: Strict mode treats warnings as errors
  const warnResults = [
    { name: 'DEP_MATRIX', status: 'warn', messages: ['Some warnings'], _root: '/test' },
    { name: 'PLAN_FORMAT', status: 'pass', messages: ['5 tasks ok'], _root: '/test' },
  ];

  const logs3 = [];
  console.log = (...args) => {
    logs3.push(args.join(' '));
  };

  exitCode = report(warnResults, { json: false, strict: true });
  console.log = origLog;

  assert.strictEqual(exitCode, 1, 'warnings in strict mode should return 1');
  console.log('  PASS: strict mode returns 1 for warnings');

  // Test 4: JSON output format
  const logs4 = [];
  console.log = (...args) => {
    logs4.push(args.join(' '));
  };
  exitCode = report(passResults, { json: true, strict: false });
  console.log = origLog;

  assert.strictEqual(exitCode, 0);
  const jsonOutput = JSON.parse(logs4[0]);
  assert.strictEqual(typeof jsonOutput.projectRoot, 'string');
  assert.ok(jsonOutput.timestamp);
  assert.strictEqual(jsonOutput.summary.passed, 2);
  console.log('  PASS: JSON output is valid');

  console.log('  All reporter tests PASS');
}

run().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

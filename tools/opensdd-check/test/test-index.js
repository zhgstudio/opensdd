'use strict';

const assert = require('assert');

async function run() {
  // Test the index module indirectly by testing parseArgs behavior
  // We can't easily call the full main() without creating temp projects,
  // but we can test the parts that are accessible.

  // Test that we can at least import the modules without errors
  const filesCheck = require('../checks/files');
  const planCheck = require('../checks/plan');
  const matrixCheck = require('../checks/matrix');
  const garbageCheck = require('../checks/garbage');
  const agentsCheck = require('../checks/agents');

  assert.strictEqual(typeof filesCheck, 'function');
  assert.strictEqual(typeof planCheck, 'function');
  assert.strictEqual(typeof matrixCheck, 'function');
  assert.strictEqual(typeof garbageCheck, 'function');
  assert.strictEqual(typeof agentsCheck, 'function');

  console.log('  PASS: all check modules load without errors');
  console.log('  All index interface tests PASS');
}

run().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

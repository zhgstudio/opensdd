'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('index.js module interfaces', () => {
  it('all check modules should load as functions', () => {
    const filesCheck = require('../checks/files');
    const planCheck = require('../checks/plan');
    const matrixCheck = require('../checks/matrix');
    const agentsCheck = require('../checks/agents');
    const frontmatterCheck = require('../checks/frontmatter');
    const moduleContentCheck = require('../checks/module-content');
    const interfaceConsistencyCheck = require('../checks/interface-consistency');
    const tbdResidualCheck = require('../checks/tbd-residual');
    const versionConsistencyCheck = require('../checks/version-consistency');
    const noTmpCheck = require('../checks/no-tmp');

    assert.strictEqual(typeof filesCheck, 'function');
    assert.strictEqual(typeof planCheck, 'function');
    assert.strictEqual(typeof matrixCheck, 'function');
    assert.strictEqual(typeof agentsCheck, 'function');
    assert.strictEqual(typeof frontmatterCheck, 'function');
    assert.strictEqual(typeof moduleContentCheck, 'function');
    assert.strictEqual(typeof interfaceConsistencyCheck, 'function');
    assert.strictEqual(typeof tbdResidualCheck, 'function');
    assert.strictEqual(typeof versionConsistencyCheck, 'function');
    assert.strictEqual(typeof noTmpCheck, 'function');
  });
});

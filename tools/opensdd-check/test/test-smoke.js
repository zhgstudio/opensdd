'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createValidProject } = require('./fixtures/valid-project');

describe('opensdd-check smoke test', () => {
  it('should pass all checks on a valid OpenSDD project', async () => {
    const { root, cleanup } = createValidProject({ withSkill: true });
    try {
      const filesCheck = require('../checks/files');
      const planCheck = require('../checks/plan');
      const matrixCheck = require('../checks/matrix');
      const garbageCheck = require('../checks/garbage');
      const agentsCheck = require('../checks/agents');
      const frontmatterCheck = require('../checks/frontmatter');
      const moduleContentCheck = require('../checks/module-content');
      const interfaceConsistencyCheck = require('../checks/interface-consistency');
      const publicDesignComplianceCheck = require('../checks/public-design-compliance');
      const config = require('../config').DEFAULT_CONFIG;

      const results = await Promise.all([
        filesCheck(root, config),
        planCheck(root, config),
        matrixCheck(root, config),
        garbageCheck(root, config),
        agentsCheck(root, config),
        frontmatterCheck(root, config),
        moduleContentCheck(root, config),
        interfaceConsistencyCheck(root, config),
        publicDesignComplianceCheck(root, config),
      ]);

      for (const r of results) {
        assert.strictEqual(r.status, 'pass', 'Check ' + r.name + ' failed: ' + r.messages.join('; '));
      }
    } finally {
      cleanup();
    }
  });
});

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const check = require('../checks/plan');
const { DEFAULT_CONFIG } = require('../config');

/**
 * Helper: create a PLAN.md with the given content in a temp directory.
 *
 * @param {string} content - Content for PLAN.md
 * @returns {{dir: string, cleanup: () => void}} Temp dir and cleanup function
 */
function createPlan(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-plan-'));
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'PLAN.md'), content, 'utf-8');
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

describe('PLAN_FORMAT check', () => {
  it('should pass with valid task lines', async () => {
    const content = `# Plan

- [ ] T-001: Setup project structure
- [ ] T-002: Implement authentication
- [x] T-003: Write tests
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
      assert.strictEqual(result.name, 'PLAN_FORMAT');
    } finally {
      cleanup();
    }
  });

  it('should fail with malformed task lines', async () => {
    const content = `# Plan

- [ ] T-001: Valid task
- [x] bad-task: Missing T-NNN format
- Not a task line
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some(m => m.includes('malformed')));
    } finally {
      cleanup();
    }
  });

  it('should detect invalid task status marker', async () => {
    // [y] does not match the regex [ x], so it's reported as malformed
    const content = `# Plan

- [y] T-001: Invalid status marker
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some(m => m.includes('malformed')));
    } finally {
      cleanup();
    }
  });

  it('should skip when PLAN.md does not exist', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-plan-nofile-'));
    try {
      const result = await check(emptyDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'skip');
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('should handle tasks with design references', async () => {
    const content = `# Plan

- [ ] T-001: Setup [01-auth/DESIGN.md#F-001]
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      // Should pass or fail depending on whether DESIGN.md exists
      assert.ok(result.status === 'pass' || result.status === 'fail');
    } finally {
      cleanup();
    }
  });

  it('should count tasks correctly', async () => {
    const content = `# Plan

- [ ] T-001: First task
- [ ] T-002: Second task
- [x] T-003: Third task (done)
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
      assert.ok(result.messages[0].includes('3 tasks'));
    } finally {
      cleanup();
    }
  });
});

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

- [ ] T-AUTH-001: Setup project structure
- [ ] T-AUTH-002: Implement authentication
- [x] T-AUTH-003: Write tests
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

- [ ] T-AUTH-001: Valid task
- [x] bad-task: Missing T-MODULE-NNN format
- Not a task line
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('malformed')));
    } finally {
      cleanup();
    }
  });

  it('should detect invalid task status marker', async () => {
    // [y] does not match the regex [ x], so it's reported as malformed
    const content = `# Plan

- [y] T-AUTH-001: Invalid status marker
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('malformed')));
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

- [ ] T-AUTH-001: Setup [auth/DESIGN.md#AUTH-F001]
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

  it('should pass with depends: syntax referencing valid task IDs', async () => {
    const content = `# Plan

- [ ] T-AUTH-001: Setup project structure
- [ ] T-AUTH-002: Implement auth [auth/DESIGN.md#AUTH-F001] depends: T-AUTH-001
- [x] T-AUTH-003: Implement login [auth/DESIGN.md#AUTH-F002] depends: T-AUTH-001, T-AUTH-002
`;
    const { dir, cleanup } = createPlan(content);
    try {
      // Create module directory with DESIGN.md so the reference validation passes
      const modDir = path.join(dir, 'docs', 'modules', '01-auth');
      fs.mkdirSync(modDir, { recursive: true });
      fs.writeFileSync(path.join(modDir, 'DESIGN.md'), '# 01-auth DESIGN', 'utf-8');
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
      assert.ok(result.messages[0].includes('3 tasks'));
    } finally {
      cleanup();
    }
  });

  it('should fail when depend references non-existent task ID', async () => {
    const content = `# Plan

- [ ] T-AUTH-001: Setup project
- [ ] T-AUTH-002: Implement auth depends: T-AUTH-999
`;
    const { dir, cleanup } = createPlan(content);
    try {
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('non-existent task ID')));
    } finally {
      cleanup();
    }
  });

  it('should count tasks correctly', async () => {
    const content = `# Plan

- [ ] T-AUTH-001: First task
- [ ] T-AUTH-002: Second task
- [x] T-AUTH-003: Third task (done)
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

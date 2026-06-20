'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const check = require('../checks/no-tmp');

describe('NO_TMP check', () => {
  it('should pass when no tmp/ directory exists', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-'));
    try {
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
      assert.strictEqual(result.name, 'NO_TMP');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should fail when root-level tmp/ directory exists', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-fail-'));
    try {
      fs.mkdirSync(path.join(dir, 'tmp'));
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.strictEqual(result.name, 'NO_TMP');
      assert.ok(result.messages[0].includes('tmp'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should fail when tmp/ exists inside docs/modules/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-deep-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'modules', '01-auth', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.strictEqual(result.name, 'NO_TMP');
      assert.ok(result.messages.some((m) => m.includes('tmp')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should pass with other directories but no tmp/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-other-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs'));
      fs.mkdirSync(path.join(dir, 'src'));
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should skip tmp/ inside node_modules/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-nm-'));
    try {
      fs.mkdirSync(path.join(dir, 'node_modules', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should skip tmp/ inside .git/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-git-'));
    try {
      fs.mkdirSync(path.join(dir, '.git', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should skip tmp/ inside nested node_modules/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-nested-nm-'));
    try {
      fs.mkdirSync(path.join(dir, 'packages', 'sub-pkg', 'node_modules', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should skip tmp/ inside nested .git/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-nested-git-'));
    try {
      fs.mkdirSync(path.join(dir, 'submodules', 'some-dep', '.git', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should detect deeply nested tmp/ in project tree', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-deepnest-'));
    try {
      fs.mkdirSync(path.join(dir, 'a', 'b', 'c', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('tmp')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should detect tmp/ in non-excluded subdirectory like src/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-src-'));
    try {
      fs.mkdirSync(path.join(dir, 'src', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('tmp')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should detect multiple tmp/ directories across the tree', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-multi-'));
    try {
      fs.mkdirSync(path.join(dir, 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.length >= 2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should not confuse temp/ or template/ with tmp/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-temp-'));
    try {
      fs.mkdirSync(path.join(dir, 'temp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'template'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'tmpdir'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should skip node_modules/tmp but catch project-level tmp/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-mix-'));
    try {
      fs.mkdirSync(path.join(dir, 'node_modules', 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'project', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('tmp')));
      assert.ok(result.messages.every((m) => !m.includes('node_modules')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should handle deeply nested single depth with many siblings', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-siblings-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'modules', '01-auth', 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'modules', '02-task', 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'modules', '03-gateway', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.length >= 3);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

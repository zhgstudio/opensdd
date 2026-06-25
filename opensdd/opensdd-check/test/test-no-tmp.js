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

  it('should fail when tmp/ exists inside docs/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-fail-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'tmp'), { recursive: true });
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

  it('should pass with other directories under docs/ but no tmp/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-other-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'modules', '01-auth'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'docs', 'SPEC.md'), '# SPEC', 'utf-8');
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should detect deeply nested tmp/ under docs/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-deepnest-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'a', 'b', 'c', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('tmp')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should detect multiple tmp/ directories under docs/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-multi-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'modules', '01-auth', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.length >= 2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should not confuse temp/ or template/ under docs/ with tmp/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-temp-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs', 'temp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'modules', 'template'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'tmpdir'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should pass when tmp/ exists outside docs/', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-outside-'));
    try {
      fs.mkdirSync(path.join(dir, 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'node_modules', 'tmp'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'src', 'tmp'), { recursive: true });
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should pass when docs/ does not exist', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-nodocs-'));
    try {
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
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

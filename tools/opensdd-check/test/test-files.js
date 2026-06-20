'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createValidProject } = require('./fixtures/valid-project');

const check = require('../checks/files');
const { DEFAULT_CONFIG } = require('../config');

describe('FILE_EXISTS check', () => {
  it('should pass when all required files exist', async () => {
    const { root, cleanup } = createValidProject();
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
      assert.strictEqual(result.name, 'FILE_EXISTS');
    } finally {
      cleanup();
    }
  });

  it('should fail when a required file is missing', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-files-empty-'));
    try {
      const result = await check(emptyDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.strictEqual(result.name, 'FILE_EXISTS');
      assert.ok(result.messages[0].includes('Missing'));
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('should report only the missing files', async () => {
    const partialDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-files-partial-'));
    try {
      fs.mkdirSync(path.join(partialDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(partialDir, 'docs', 'SPEC.md'), '# test', 'utf-8');

      const result = await check(partialDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages[0].includes('ARCHITECTURE.md'));
      assert.ok(result.messages[0].includes('PLAN.md'));
      assert.ok(result.messages[0].includes('AGENTS.md'));
    } finally {
      fs.rmSync(partialDir, { recursive: true, force: true });
    }
  });
});

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const check = require('../checks/no-tmp');

describe('NO_TMP check', () => {
  it('should pass when no tmp/ directory exists', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-'));
    try {
      const result = await check(dir, { requiredFiles: [] });
      assert.strictEqual(result.status, 'pass');
      assert.strictEqual(result.name, 'NO_TMP');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should fail when tmp/ directory exists', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-fail-'));
    try {
      fs.mkdirSync(path.join(dir, 'tmp'));
      const result = await check(dir, { requiredFiles: [] });
      assert.strictEqual(result.status, 'fail');
      assert.strictEqual(result.name, 'NO_TMP');
      assert.ok(result.messages[0].includes('tmp'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should pass with other directories but no tmp/', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-notmp-other-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs'));
      fs.mkdirSync(path.join(dir, 'src'));
      const result = await check(dir, { requiredFiles: [] });
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

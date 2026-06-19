'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_CONFIG = require('../config').DEFAULT_CONFIG;

describe('NO_GARBAGE check', () => {
  it('should pass when no garbage files exist', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gb-'));
    try {
      const check = require('../checks/garbage');
      fs.writeFileSync(path.join(root, 'README.md'), '# clean project');
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when _v2.md exists', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gb-'));
    try {
      const check = require('../checks/garbage');
      fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(root, 'docs', 'SPEC_v2.md'), 'garbage');
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('SPEC_v2.md')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when _final.md exists', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gb-'));
    try {
      const check = require('../checks/garbage');
      fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(root, 'docs', 'ARCHITECTURE_final.md'), 'garbage');
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('ARCHITECTURE_final.md')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when .bak.md exists', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gb-'));
    try {
      const check = require('../checks/garbage');
      fs.writeFileSync(path.join(root, 'PLAN.md.bak'), 'garbage');
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('PLAN.md.bak')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should skip node_modules directory', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-gb-'));
    try {
      const check = require('../checks/garbage');
      fs.mkdirSync(path.join(root, 'node_modules'), { recursive: true });
      fs.writeFileSync(path.join(root, 'node_modules', 'some_v2.md'), 'garbage');
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

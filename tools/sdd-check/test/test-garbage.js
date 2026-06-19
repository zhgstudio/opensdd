'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const check = require('../checks/garbage');
const { DEFAULT_CONFIG } = require('../config');

describe('NO_GARBAGE check', () => {
  it('should detect garbage files like _v2.md', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'doc_v2.md'), 'garbage', 'utf-8');
      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages[0].includes('garbage'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should detect _final.md files', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'report_final.md'), 'garbage', 'utf-8');
      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages[0].includes('garbage'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should detect .bak.md files', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'spec.bak.md'), 'garbage', 'utf-8');
      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages[0].includes('garbage'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should pass when no garbage files exist', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'README.md'), 'clean', 'utf-8');
      fs.writeFileSync(path.join(tmpDir, 'index.js'), 'clean', 'utf-8');
      fs.writeFileSync(path.join(tmpDir, 'SPEC.md'), 'clean', 'utf-8');

      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should skip node_modules directory', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      const nmDir = path.join(tmpDir, 'node_modules');
      fs.mkdirSync(nmDir, { recursive: true });
      fs.writeFileSync(path.join(nmDir, 'lib_v2.md'), 'garbage', 'utf-8');

      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should detect _tmp files', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'notes_tmp.md'), 'garbage', 'utf-8');
      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages[0].includes('garbage'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should detect _old files', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-garbage-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'draft_old.md'), 'garbage', 'utf-8');
      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages[0].includes('garbage'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

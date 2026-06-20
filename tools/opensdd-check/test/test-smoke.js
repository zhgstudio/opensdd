'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { createValidProject } = require('./fixtures/valid-project');

const INDEX_PATH = path.resolve(__dirname, '..', 'index.js');

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
      ]);

      for (const r of results) {
        assert.strictEqual(r.status, 'pass', 'Check ' + r.name + ' failed: ' + r.messages.join('; '));
      }
    } finally {
      cleanup();
    }
  });
});

describe('opensdd-check integration (via child_process)', () => {
  it('should exit 0 on valid project with --json output', () => {
    const { root, cleanup } = createValidProject({ withSkill: true });
    try {
      const result = spawnSync(process.execPath, [INDEX_PATH, '--path', root, '--json'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      assert.strictEqual(result.status, 0, `Expected exit 0, got ${result.status}\nstderr: ${result.stderr}`);

      const parsed = JSON.parse(result.stdout);
      assert.ok(parsed.projectRoot, 'Missing projectRoot');
      assert.ok(parsed.timestamp, 'Missing timestamp');
      assert.ok(parsed.summary, 'Missing summary');
      assert.ok(Array.isArray(parsed.results), 'Missing results array');

      for (const r of parsed.results) {
        assert.strictEqual(r.status, 'pass', `Check ${r.name} failed: ${r.messages.join('; ')}`);
      }
    } finally {
      cleanup();
    }
  });

  it('should exit 1 on missing required files', () => {
    const { root, cleanup } = createValidProject();
    try {
      // Remove SPEC.md to trigger failure
      const fs = require('node:fs');
      fs.rmSync(path.join(root, 'docs/SPEC.md'), { force: true });

      const result = spawnSync(process.execPath, [INDEX_PATH, '--path', root, '--json'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      assert.strictEqual(result.status, 1, `Expected exit 1, got ${result.status}`);

      const parsed = JSON.parse(result.stdout);
      const filesResult = parsed.results.find((r) => r.name === 'FILE_EXISTS');
      assert.ok(filesResult, 'FILE_EXISTS check not found');
      assert.strictEqual(filesResult.status, 'fail');
    } finally {
      cleanup();
    }
  });

  it('should accept --strict flag', () => {
    const { root, cleanup } = createValidProject({ withSkill: true });
    try {
      const result = spawnSync(process.execPath, [INDEX_PATH, '--path', root, '--strict', '--json'], {
        encoding: 'utf-8',
        timeout: 10000,
      });

      assert.strictEqual(result.status, 0, `Expected exit 0 in strict mode, got ${result.status}`);

      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.strict, true, 'Expected strict=true in output');
    } finally {
      cleanup();
    }
  });

  it('should print help text with --help', () => {
    const result = spawnSync(process.execPath, [INDEX_PATH, '--help'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('opensdd-check'));
    assert.ok(result.stdout.includes('USAGE'));
  });
});

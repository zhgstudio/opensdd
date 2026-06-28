'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('TBD_RESIDUAL check', () => {
  const check = require('../checks/tbd-residual');

  /** @type {import('../config').SddConfig} */
  const config = {};

  function createProject(content) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-tbd-'));
    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'ARCHITECTURE.md'), content, 'utf-8');
    return tmpDir;
  }

  it('should pass when ARCHITECTURE.md has no [TBD] markers', () => {
    const dir = createProject(
      [
        '# Architecture',
        '## 模块依赖矩阵',
        '| 模块 | 依赖 | 所需接口 |',
        '|------|------|----------|',
        '| 02-task-core | 01-auth | POST /auth/verify |',
      ].join('\n'),
    );
    try {
      const result = check(dir, config);
      assert.strictEqual(result.status, 'pass');
      assert.ok(result.messages[0].includes('No residual'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should fail when ARCHITECTURE.md contains [TBD] markers', () => {
    const dir = createProject(
      [
        '# Architecture',
        '## 模块依赖矩阵',
        '| 模块 | 依赖 | 所需接口 |',
        '|------|------|----------|',
        '| 02-task-core | 01-auth | POST /auth/verify, [TBD: 角色鉴权接口] |',
      ].join('\n'),
    );
    try {
      const result = check(dir, config);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages[0].includes('[TBD]'));
      assert.ok(result.messages.some((m) => m.includes('line')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should skip when ARCHITECTURE.md does not exist', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-tbd-skip-'));
    try {
      const result = check(emptyDir, config);
      assert.strictEqual(result.status, 'skip');
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('should fail on multiple [TBD] markers in different sections', () => {
    const dir = createProject(
      [
        '# Architecture',
        '## 模块依赖矩阵',
        '| 模块 | 依赖 | 所需接口 |',
        '|------|------|----------|',
        '| 02-task-core | 01-auth | [TBD: 鉴权接口] |',
        '| 03-api-gateway | 02-task-core | [TBD: 路由接口] |',
      ].join('\n'),
    );
    try {
      const result = check(dir, config);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages[0].startsWith('Found 2'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should fail on inline [TBD] in running text', () => {
    const dir = createProject('# Architecture\n\nSome text with a [TBD] marker in a paragraph.');
    try {
      const result = check(dir, config);
      assert.strictEqual(result.status, 'fail');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

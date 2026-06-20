'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('interface-consistency', () => {
  const check = require('../checks/interface-consistency');
  const DEFAULT_CONFIG = require('../config').DEFAULT_CONFIG;

  /** @type {string} */
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-iface-'));
    const docsDir = path.join(tmpDir, 'docs');
    const mod01Dir = path.join(docsDir, 'modules', '01-auth');
    const mod02Dir = path.join(docsDir, 'modules', '02-task-core');
    fs.mkdirSync(mod01Dir, { recursive: true });
    fs.mkdirSync(mod02Dir, { recursive: true });

    // ARCHITECTURE.md with dependency matrix
    fs.writeFileSync(
      path.join(docsDir, 'ARCHITECTURE.md'),
      [
        '# Architecture',
        '',
        '## \u6a21\u5757\u5f15\u7528\u8868',
        '| \u7f16\u53f7 | \u6a21\u5757\u540d | \u529f\u80fd\u7b80\u8ff0 | \u8be6\u7ec6\u8bbe\u8ba1 |',
        '|------|--------|----------|----------|',
        '| 01 | auth | Auth | docs/modules/01-auth/ |',
        '| 02 | task-core | Task | docs/modules/02-task-core/ |',
        '',
        '## \u6a21\u5757\u4f9d\u8d56\u77e9\u9635',
        '| \u6a21\u5757 | \u4f9d\u8d56 | \u6240\u9700\u63a5\u53e3 |',
        '|------|------|----------|',
        '| 02-task-core | 01-auth | POST /auth/verify |',
      ].join('\n'),
      'utf-8',
    );

    // Provider module (01-auth) with matching API
    fs.writeFileSync(
      path.join(mod01Dir, 'API.md'),
      [
        '# 01-auth API',
        '',
        '## \u63a5\u53e3\u5b9a\u4e49',
        '- POST /auth/register',
        '- POST /auth/login',
        '- POST /auth/verify',
      ].join('\n'),
      'utf-8',
    );

    // Consumer module (02-task-core) needs API.md for interface check to run
    fs.writeFileSync(
      path.join(mod02Dir, 'API.md'),
      ['# 02-task-core API', '', '## \u63a5\u53e3\u5b9a\u4e49', '- POST /task/create', '- POST /task/list'].join('\n'),
      'utf-8',
    );
  });

  after(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should pass when all interfaces match', async () => {
    const result = await check(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
  });

  it('should fail when required interface is missing from provider', async () => {
    // Overwrite provider API to remove the required endpoint
    const mod01Dir = path.join(tmpDir, 'docs/modules/01-auth');
    fs.writeFileSync(
      path.join(mod01Dir, 'API.md'),
      ['# 01-auth API', '', '## \u63a5\u53e3\u5b9a\u4e49', '- POST /auth/register'].join('\n'),
      'utf-8',
    );

    const result = await check(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'fail');
    assert.ok(result.messages.some((m) => m.includes('POST /auth/verify')));

    // Restore
    fs.writeFileSync(
      path.join(mod01Dir, 'API.md'),
      [
        '# 01-auth API',
        '',
        '## \u63a5\u53e3\u5b9a\u4e49',
        '- POST /auth/register',
        '- POST /auth/login',
        '- POST /auth/verify',
      ].join('\n'),
      'utf-8',
    );
  });

  it('should skip when no ARCHITECTURE.md', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-iface-empty-'));
    const result = await check(emptyDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'skip');
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('should pass when dependency references non-existent module directory (entry skipped gracefully)', async () => {
    const ndDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-iface-nomoddir-'));
    try {
      const ndDocs = path.join(ndDir, 'docs');
      fs.mkdirSync(ndDocs, { recursive: true });
      // 01-auth exists as directory, but 02-task-core does not
      const ndMod01 = path.join(ndDocs, 'modules', '01-auth');
      fs.mkdirSync(ndMod01, { recursive: true });
      fs.writeFileSync(path.join(ndMod01, 'API.md'), '# 01-auth API\n\n## 接口定义\n- POST /auth/verify\n', 'utf-8');
      fs.writeFileSync(
        path.join(ndDocs, 'ARCHITECTURE.md'),
        [
          '# Architecture',
          '## 模块引用表',
          '| 编号 | 模块名 | 功能简述 | 详细设计 |',
          '|------|--------|----------|----------|',
          '| 01 | auth | Auth | docs/modules/01-auth/ |',
          '| 02 | task-core | Task | docs/modules/02-task-core/ |',
          '',
          '## 模块依赖矩阵',
          '| 模块 | 依赖 | 所需接口 |',
          '|------|------|----------|',
          '| 02-task-core | 01-auth | POST /auth/verify |',
        ].join('\n'),
        'utf-8',
      );
      const result = await check(ndDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(ndDir, { recursive: true, force: true });
    }
  });

  it('should filter out [TBD] markers from dependency interfaces', async () => {
    const tbdDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-iface-tbd-'));
    try {
      const tbdDocs = path.join(tbdDir, 'docs');
      const tbdMod01 = path.join(tbdDocs, 'modules', '01-auth');
      const tbdMod02 = path.join(tbdDocs, 'modules', '02-task-core');
      fs.mkdirSync(tbdMod01, { recursive: true });
      fs.mkdirSync(tbdMod02, { recursive: true });
      fs.writeFileSync(path.join(tbdMod01, 'API.md'), '# 01-auth API\n\n## 接口定义\n- POST /auth/verify\n', 'utf-8');
      fs.writeFileSync(path.join(tbdMod02, 'API.md'), '# 02-task-core API\n\n## 接口定义\n- GET /task/list\n', 'utf-8');
      fs.writeFileSync(
        path.join(tbdDocs, 'ARCHITECTURE.md'),
        [
          '# Architecture',
          '## 模块引用表',
          '| 编号 | 模块名 | 功能简述 | 详细设计 |',
          '|------|--------|----------|----------|',
          '| 01 | auth | Auth | docs/modules/01-auth/ |',
          '| 02 | task-core | Task | docs/modules/02-task-core/ |',
          '',
          '## 模块依赖矩阵',
          '| 模块 | 依赖 | 所需接口 |',
          '|------|------|----------|',
          '| 02-task-core | 01-auth | POST /auth/verify, [TBD: 角色鉴权接口] |',
        ].join('\n'),
        'utf-8',
      );
      const result = await check(tbdDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(tbdDir, { recursive: true, force: true });
    }
  });

  it('should skip when no dependency matrix found', async () => {
    const noDepDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-iface-nodep-'));
    const docsDir = path.join(noDepDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'ARCHITECTURE.md'), '# Architecture\n\nJust a description.\n', 'utf-8');
    const result = await check(noDepDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'skip');
    fs.rmSync(noDepDir, { recursive: true, force: true });
  });
});

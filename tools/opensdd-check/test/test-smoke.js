'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const filesCheck = require('../checks/files');
const planCheck = require('../checks/plan');
const matrixCheck = require('../checks/matrix');
const garbageCheck = require('../checks/garbage');
const agentsCheck = require('../checks/agents');
const { DEFAULT_CONFIG } = require('../config');

/**
 * Create a minimal valid OpenSDD project structure for smoke testing.
 *
 * @param {string} dir - Root directory for the test project
 */
function createMinimalProject(dir) {
  // Required files
  fs.mkdirSync(path.join(dir, 'docs/modules/01-auth'), { recursive: true });

  fs.writeFileSync(path.join(dir, 'docs/SPEC.md'), '# SPEC', 'utf-8');
  fs.writeFileSync(
    path.join(dir, 'docs/ARCHITECTURE.md'),
    '# ARCHITECTURE\n\n## 模块引用表\n| 编号 | 模块名 | 功能简述 | 详细设计 |\n|------|--------|----------|----------|\n| 01 | auth | Auth | docs/modules/01-auth/DESIGN.md |\n\n## 模块依赖矩阵\n| 模块 | 依赖 | 所需接口 |\n|------|------|----------|\n| 01-auth | - | none |\n',
    'utf-8',
  );
  fs.writeFileSync(path.join(dir, 'docs/PLAN.md'), '# Plan\n\n- [ ] T-001: Setup [01-auth/DESIGN.md#F-001]\n', 'utf-8');
  fs.writeFileSync(
    path.join(dir, 'AGENTS.md'),
    '# AGENTS.md\n\n## 质量验收标准\nContent\n\n## 文件操作范围\nContent\n\n## 提交规范\nContent\n\n## 测试要求\nContent\n\n## 升级条件\nContent\n\n## 跨模块规则\nContent\n\n## 任务规范\nContent\n',
    'utf-8',
  );
  fs.writeFileSync(path.join(dir, 'docs/modules/01-auth/DESIGN.md'), '## DESIGN\n\n### F-001: Auth feature\n', 'utf-8');
}

describe('opensdd-check — smoke test (full E2E)', () => {
  /** @type {string} */
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-smoke-'));
    createMinimalProject(tmpDir);
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('FILE_EXISTS should pass on valid project', async () => {
    const result = await filesCheck(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
  });

  it('PLAN_FORMAT should pass on valid project', async () => {
    const result = await planCheck(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
  });

  it('DEP_MATRIX should pass on valid project', async () => {
    const result = await matrixCheck(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
  });

  it('NO_GARBAGE should pass on clean project', async () => {
    const result = await garbageCheck(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
  });

  it('AGENTS_SECTIONS should pass on valid AGENTS.md', async () => {
    const result = await agentsCheck(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
  });

  it('all 5 checks should pass simultaneously', async () => {
    const results = await Promise.all([
      filesCheck(tmpDir, DEFAULT_CONFIG),
      planCheck(tmpDir, DEFAULT_CONFIG),
      matrixCheck(tmpDir, DEFAULT_CONFIG),
      garbageCheck(tmpDir, DEFAULT_CONFIG),
      agentsCheck(tmpDir, DEFAULT_CONFIG),
    ]);

    const failed = results.filter((r) => r.status !== 'pass');
    assert.strictEqual(
      failed.length,
      0,
      `Expected all pass, got: ${failed.map((r) => `${r.name}=${r.status}`).join(', ')}`,
    );
  });
});

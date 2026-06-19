'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const DEFAULT_CONFIG = require('../config').DEFAULT_CONFIG;

/**
 * Create a temporary directory with a docs/modules/{NN}-{name} structure.
 * Returns { root, cleanup }.
 */
function createModuleProject(moduleDir, apiContent, designContent) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mc-'));
  const modPath = path.join(root, 'docs', 'modules', moduleDir);
  fs.mkdirSync(modPath, { recursive: true });

  if (apiContent !== undefined) {
    fs.writeFileSync(path.join(modPath, 'API.md'), apiContent, 'utf-8');
  }
  if (designContent !== undefined) {
    fs.writeFileSync(path.join(modPath, 'DESIGN.md'), designContent, 'utf-8');
  }

  return {
    root,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

describe('MODULE_CONTENT check', () => {
  it('should pass when module has all required sections', async () => {
    const check = require('../checks/module-content');
    const { root, cleanup } = createModuleProject(
      '01-auth',
      [
        '# 01-auth 接口',
        '',
        '## 模块概述与职责边界',
        '负责用户认证。',
        '',
        '## 核心数据结构',
        '- user: { id, email }',
        '',
        '## 接口定义',
        '- POST /auth/register',
      ].join('\n'),
      [
        '# 01-auth 内部',
        '',
        '## 核心逻辑流程',
        '注册流程。',
        '',
        '## 内部实现细节',
        '使用 bcrypt。',
        '',
        '## 功能特性列表',
        '### 01-F001: 用户注册',
        '实现注册接口。',
      ].join('\n'),
    );
    const result = await check(root, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
    cleanup();
  });

  it('should fail when API.md is missing required section', async () => {
    const check = require('../checks/module-content');
    const { root, cleanup } = createModuleProject(
      '01-auth',
      ['# 01-auth 接口', '', '## 接口定义', '- POST /auth/register'].join('\n'),
      ['## 核心逻辑流程', 'ok', '', '## 内部实现细节', 'ok', '', '## 功能特性列表', '### 01-F001: test'].join('\n'),
    );
    const result = await check(root, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'fail');
    assert.ok(result.messages.some((m) => m.includes('模块概述与职责边界')));
    assert.ok(result.messages.some((m) => m.includes('核心数据结构')));
    cleanup();
  });

  it('should fail when DESIGN.md is missing feature list', async () => {
    const check = require('../checks/module-content');
    const { root, cleanup } = createModuleProject(
      '01-auth',
      ['## 模块概述与职责边界', 'ok', '', '## 核心数据结构', 'ok', '', '## 接口定义', 'ok'].join('\n'),
      ['## 核心逻辑流程', 'ok', '', '## 内部实现细节', 'ok', '', '## 功能特性列表', '(empty)'].join('\n'),
    );
    const result = await check(root, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'fail');
    assert.ok(result.messages.some((m) => m.includes('feature list entries')));
    cleanup();
  });

  it('should fail when API.md is missing entirely', async () => {
    const check = require('../checks/module-content');
    const { root, cleanup } = createModuleProject('01-auth', undefined, ['## 核心逻辑流程', 'ok'].join('\n'));
    const result = await check(root, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'fail');
    assert.ok(result.messages.some((m) => m.includes('API.md not found')));
    cleanup();
  });

  it('should skip when docs/modules/ does not exist', async () => {
    const check = require('../checks/module-content');
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mc-empty-'));
    const result = await check(emptyDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'skip');
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('should warn when docs/modules/ has no subdirectories', async () => {
    const check = require('../checks/module-content');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-mc-empty2-'));
    fs.mkdirSync(path.join(root, 'docs/modules'), { recursive: true });
    const result = await check(root, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'warn');
    fs.rmSync(root, { recursive: true, force: true });
  });
});

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseModuleTable, parseDependencyMatrix, parseDependencies, splitRow } = require('../checks/matrix');

describe('parseModuleTable', () => {
  it('should parse Chinese 4-column module reference table', () => {
    const content = `# ARCHITECTURE

## 模块引用表
| 编号 | 模块名 | 功能简述 | 详细设计 |
|------|--------|----------|----------|
| 01 | auth | 用户认证 | docs/modules/01-auth/API.md |
| 02 | task-core | 任务核心 | docs/modules/02-task-core/API.md |
`;
    const modules = parseModuleTable(content);
    assert.strictEqual(modules.length, 2);
    assert.strictEqual(modules[0].name, '01-auth');
    assert.strictEqual(modules[0].description, 'auth');
    assert.strictEqual(modules[0].ref, 'docs/modules/01-auth/API.md');
    assert.strictEqual(modules[1].name, '02-task-core');
    assert.strictEqual(modules[1].ref, 'docs/modules/02-task-core/API.md');
  });

  it('should parse English 3-column module reference table', () => {
    const content = `# ARCHITECTURE

## Module Reference Table
| Module | Name | Design |
|--------|------|--------|
| 01 | auth | docs/modules/01-auth/API.md |
`;
    const modules = parseModuleTable(content);
    assert.strictEqual(modules.length, 1);
    assert.strictEqual(modules[0].name, '01-auth');
    assert.strictEqual(modules[0].ref, 'docs/modules/01-auth/API.md');
  });

  it('should parse English 4-column module reference table', () => {
    const content = `# ARCHITECTURE

## Module Reference Table
| Module | Name | Description | Design |
|--------|------|-------------|--------|
| 01 | auth | User authentication | docs/modules/01-auth/API.md |
`;
    const modules = parseModuleTable(content);
    assert.strictEqual(modules.length, 1);
    assert.strictEqual(modules[0].name, '01-auth');
    assert.strictEqual(modules[0].ref, 'docs/modules/01-auth/API.md');
  });

  it('should return empty array when no table found', () => {
    const content = '# Just a heading\n\nSome text without tables.\n';
    const modules = parseModuleTable(content);
    assert.strictEqual(modules.length, 0);
  });

  it('should stop scanning at next heading after finding rows', () => {
    const content = `## 模块引用表
| 编号 | 模块名 | 功能简述 | 详细设计 |
|------|--------|----------|----------|
| 01 | auth | Auth | path |

## 其他章节
| 01 | garbage | should not parse | path |
`;
    const modules = parseModuleTable(content);
    assert.strictEqual(modules.length, 1);
  });
});

describe('parseDependencyMatrix', () => {
  it('should parse Chinese dependency matrix', () => {
    const content = `# ARCHITECTURE

## 模块依赖矩阵
| 模块 | 依赖 | 所需接口 |
|------|------|----------|
| 02-task-core | 01-auth | POST /auth/verify |
| 03-api-gateway | 01-auth, 02-task-core | various |
`;
    const modules = parseDependencyMatrix(content);
    assert.strictEqual(modules.length, 2);
    assert.strictEqual(modules[0].name, '02-task-core');
    assert.strictEqual(modules[0].depends, '01-auth');
    assert.strictEqual(modules[1].depends, '01-auth, 02-task-core');
  });

  it('should parse English dependency matrix', () => {
    const content = `# ARCHITECTURE

## Dependency Matrix
| Module | Depends On | Required Interface |
|--------|------------|-------------------|
| 02-task-core | 01-auth | POST /auth/verify |
`;
    const modules = parseDependencyMatrix(content);
    assert.strictEqual(modules.length, 1);
    assert.strictEqual(modules[0].name, '02-task-core');
  });

  it('should return empty array when no matrix found', () => {
    const content = '# Just a heading';
    const modules = parseDependencyMatrix(content);
    assert.strictEqual(modules.length, 0);
  });
});

describe('splitRow', () => {
  it('should parse 3-column row', () => {
    const cells = splitRow('| 01 | auth | docs/modules/01-auth/API.md |');
    assert.deepStrictEqual(cells, ['01', 'auth', 'docs/modules/01-auth/API.md']);
  });

  it('should parse 4-column row', () => {
    const cells = splitRow('| 01 | auth | 用户认证 | docs/modules/01-auth/API.md |');
    assert.deepStrictEqual(cells, ['01', 'auth', '用户认证', 'docs/modules/01-auth/API.md']);
  });

  it('should handle extra spaces within cells', () => {
    const cells = splitRow('| 01  |  auth  |  design  |');
    assert.deepStrictEqual(cells, ['01', 'auth', 'design']);
  });

  it('should return null for non-table row', () => {
    assert.strictEqual(splitRow('Some text without pipes'), null);
  });

  it('should return null for separator row with dashes', () => {
    assert.strictEqual(splitRow('|------|--------|----------|'), null);
  });

  it('should return null for separator row with colons', () => {
    assert.strictEqual(splitRow('|:-----|:-------|:--------|'), null);
  });
});

describe('parseDependencies', () => {
  it('should parse single dependency', () => {
    assert.deepStrictEqual(parseDependencies('01-auth'), ['01-auth']);
  });

  it('should parse comma-separated dependencies', () => {
    assert.deepStrictEqual(parseDependencies('01-auth, 02-task-core'), ['01-auth', '02-task-core']);
  });

  it('should handle spaces around commas', () => {
    assert.deepStrictEqual(parseDependencies('01-auth,02-task-core,  03-gateway'), [
      '01-auth',
      '02-task-core',
      '03-gateway',
    ]);
  });

  it('should filter empty entries', () => {
    assert.deepStrictEqual(parseDependencies('01-auth, ,02-task-core'), ['01-auth', '02-task-core']);
  });

  it('should return empty array for empty string', () => {
    assert.deepStrictEqual(parseDependencies(''), []);
  });

  it('should return empty array for whitespace-only string', () => {
    assert.deepStrictEqual(parseDependencies('   '), []);
  });
});

describe('DEP_MATRIX full check', () => {
  const os = require('node:os');
  const fs = require('node:fs');
  const path = require('node:path');
  const { DEFAULT_CONFIG } = require('../config');

  function createProject(archMdContent, modules) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-matint-'));
    const docsDir = path.join(root, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'ARCHITECTURE.md'), archMdContent, 'utf-8');
    for (const [modDir, files] of Object.entries(modules)) {
      const modPath = path.join(docsDir, 'modules', modDir);
      fs.mkdirSync(modPath, { recursive: true });
      for (const [name, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(modPath, name), content || '', 'utf-8');
      }
    }
    return root;
  }

  it('should pass when all modules exist with API.md', async () => {
    const check = require('../checks/matrix');
    const arch = `## 模块引用表
| 编号 | 模块名 | 功能简述 | 详细设计 |
|------|--------|----------|----------|
| 01 | auth | Auth | path |
| 02 | task-core | Tasks | path |

## 模块依赖矩阵
| 模块 | 依赖 | 所需接口 |
|------|------|----------|
| 02-task-core | 01-auth | POST /auth/verify |`;
    const root = createProject(arch, {
      '01-auth': { 'API.md': '# auth API' },
      '02-task-core': { 'API.md': '# task API' },
    });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when module directory missing', async () => {
    const check = require('../checks/matrix');
    const arch = `## 模块引用表
| 编号 | 模块名 | 功能简述 | 详细设计 |
|------|--------|----------|----------|
| 01 | auth | Auth | path |
| 99 | missing | Missing | path |`;
    const root = createProject(arch, { '01-auth': { 'API.md': '# auth API' } });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('missing')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should warn on orphan module directory not in reference table', async () => {
    const check = require('../checks/matrix');
    const arch = `## 模块引用表
| 编号 | 模块名 | 功能简述 | 详细设计 |
|------|--------|----------|----------|
| 01 | auth | Auth | path |`;
    const root = createProject(arch, {
      '01-auth': { 'API.md': '# auth API' },
      '02-orphan': { 'API.md': '# orphan API' },
    });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('Orphan')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when API.md missing in declared module', async () => {
    const check = require('../checks/matrix');
    const arch = `## 模块引用表
| 编号 | 模块名 | 功能简述 | 详细设计 |
|------|--------|----------|----------|
| 01 | auth | Auth | path |`;
    const root = createProject(arch, { '01-auth': {} });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('API.md')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

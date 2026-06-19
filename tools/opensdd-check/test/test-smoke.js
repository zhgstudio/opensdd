'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('opensdd-check smoke test', () => {
  /** @type {string} */
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-smoke-'));

    const docsDir = path.join(tmpDir, 'docs');
    const modulesDir = path.join(docsDir, 'modules', '01-auth');
    const opensddDir = path.join(tmpDir, 'opensdd');

    fs.mkdirSync(docsDir, { recursive: true });
    fs.mkdirSync(modulesDir, { recursive: true });
    fs.mkdirSync(opensddDir, { recursive: true });

    fs.writeFileSync(
      path.join(docsDir, 'SPEC.md'),
      [
        '# 需求规格',
        '',
        '## 业务背景',
        '这是一个测试项目。',
        '',
        '## 功能需求',
        '- 用户注册',
        '- 用户登录',
        '',
        '## 非功能性约束',
        '- 响应时间 < 200ms',
      ].join('\n'),
      'utf-8',
    );

    fs.writeFileSync(
      path.join(docsDir, 'ARCHITECTURE.md'),
      [
        '# 总体架构设计',
        '',
        '## 技术栈标准',
        'Node.js, Express',
        '',
        '## 模块引用表',
        '| 编号 | 模块名 | 功能简述 | 详细设计 |',
        '|------|--------|----------|----------|',
        '| 01 | auth | 用户认证 | docs/modules/01-auth/API.md |',
        '',
        '## 模块依赖矩阵',
        '| 模块 | 依赖 | 所需接口 |',
        '|------|------|----------|',
        '| 01-auth | - | - |',
      ].join('\n'),
      'utf-8',
    );

    fs.writeFileSync(
      path.join(docsDir, 'PLAN.md'),
      [
        '# 任务计划',
        '',
        '## 模块：01-auth',
        '- [ ] T-001: 实现用户注册接口 [01-auth/DESIGN.md#01-F001]',
        '- [ ] T-002: 实现用户登录接口 [01-auth/DESIGN.md#01-F002]',
      ].join('\n'),
      'utf-8',
    );

    fs.writeFileSync(
      path.join(tmpDir, 'AGENTS.md'),
      [
        '# AGENTS',
        '',
        '## 文件操作范围',
        '仅允许操作 src/ 目录。',
        '',
        '## 提交规范',
        'feat: / fix: / chore:',
        '',
        '## 测试要求',
        '覆盖率不低于 80%。',
        '',
        '## 升级条件',
        '跨模块接口变更须升级。',
        '',
        '## 跨模块规则',
        '只读依赖模块的 API.md。',
        '',
        '## 任务规范',
        '参考 PLAN.md 完成开发。',
      ].join('\n'),
      'utf-8',
    );

    fs.writeFileSync(
      path.join(modulesDir, 'API.md'),
      [
        '# 01-auth 模块接口',
        '',
        '## 模块概述与职责边界',
        '负责用户认证。',
        '',
        '## 核心数据结构',
        '- user: { id, email, password }',
        '',
        '## 接口定义',
        '- POST /auth/register',
        '- POST /auth/login',
      ].join('\n'),
      'utf-8',
    );

    fs.writeFileSync(
      path.join(modulesDir, 'DESIGN.md'),
      [
        '# 01-auth 模块内部实现',
        '',
        '## 核心逻辑流程',
        '注册流程：验证邮箱 -> 加密密码 -> 存入数据库',
        '',
        '## 内部实现细节',
        '使用 bcrypt 加密密码。',
        '',
        '## 功能特性列表',
        '### 01-F001: 用户注册接口',
        '实现 POST /auth/register 端点。',
        '',
        '### 01-F002: 用户登录接口',
        '实现 POST /auth/login 端点。',
      ].join('\n'),
      'utf-8',
    );

    fs.writeFileSync(
      path.join(opensddDir, 'SKILL.md'),
      [
        '---',
        'name: opensdd',
        'description: "test"',
        'metadata.author: test',
        'metadata.version: 1.0.0',
        '---',
        '',
      ].join('\n'),
      'utf-8',
    );
  });

  after(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should pass all checks on a valid OpenSDD project', async () => {
    const filesCheck = require('../checks/files');
    const planCheck = require('../checks/plan');
    const matrixCheck = require('../checks/matrix');
    const garbageCheck = require('../checks/garbage');
    const agentsCheck = require('../checks/agents');
    const frontmatterCheck = require('../checks/frontmatter');
    const moduleContentCheck = require('../checks/module-content');
    const interfaceConsistencyCheck = require('../checks/interface-consistency');
    const languageCheck = require('../checks/language');
    const publicDesignComplianceCheck = require('../checks/public-design-compliance');
    const config = require('../config').DEFAULT_CONFIG;

    const results = await Promise.all([
      filesCheck(tmpDir, config),
      planCheck(tmpDir, config),
      matrixCheck(tmpDir, config),
      garbageCheck(tmpDir, config),
      agentsCheck(tmpDir, config),
      frontmatterCheck(tmpDir, config),
      moduleContentCheck(tmpDir, config),
      interfaceConsistencyCheck(tmpDir, config),
      languageCheck(tmpDir, config),
      publicDesignComplianceCheck(tmpDir, config),
    ]);

    for (const r of results) {
      assert.strictEqual(r.status, 'pass', 'Check ' + r.name + ' failed: ' + r.messages.join('; '));
    }
  });
});

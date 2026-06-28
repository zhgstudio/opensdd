'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Build a minimal valid OpenSDD project in a temp directory.
 *
 * @param {object} [overrides]
 * @param {string[]} [overrides.modules] - Module dirs to create, e.g. ['01-auth']
 * @param {boolean} [overrides.withSkill] - Whether to create opensdd/SKILL.md
 * @returns {{ root: string, cleanup: () => void }}
 */
function createValidProject(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-valid-'));

  const docsDir = path.join(root, 'docs');
  const moduleDirs = overrides.modules || ['01-auth'];

  fs.mkdirSync(docsDir, { recursive: true });

  fs.writeFileSync(
    path.join(docsDir, 'SPEC.md'),
    [
      '# 需求规格',
      '## 业务背景',
      '测试项目。',
      '## 功能需求',
      '- REQ-AUTH-001: 用户注册',
      '## 非功能性约束',
      '- 响应时间 < 200ms',
    ].join('\n'),
    'utf-8',
  );

  const moduleRows = moduleDirs
    .map((m) => {
      const parts = m.split('-');
      const num = parts[0];
      const name = parts.slice(1).join('-');
      return `| ${num} | ${name} | test | docs/modules/${m}/API.md |`;
    })
    .join('\n');

  const depRows = moduleDirs.map((m) => `| ${m} | - | - |`).join('\n');

  fs.writeFileSync(
    path.join(docsDir, 'ARCHITECTURE.md'),
    [
      '# 总体架构设计',
      '## 技术栈标准',
      'Node.js',
      '## 模块引用表',
      '| 编号 | 模块名 | 功能简述 | 详细设计 |',
      '|------|--------|----------|----------|',
      moduleRows,
      '## 模块依赖矩阵',
      '| 模块 | 依赖 | 所需接口 |',
      '|------|------|----------|',
      depRows,
    ].join('\n'),
    'utf-8',
  );

  fs.writeFileSync(
    path.join(docsDir, 'PLAN.md'),
    [
      '# 任务计划',
      ...moduleDirs.map((m, i) => {
        const moduleName = m.split('-').slice(1).join('-').toUpperCase();
        return `- [ ] T-${moduleName}-${String(i + 1).padStart(3, '0')}: 实现接口 [${m}/DESIGN.md#${moduleName}-F001]`;
      }),
    ].join('\n'),
    'utf-8',
  );

  fs.writeFileSync(
    path.join(root, 'AGENTS.md'),
    [
      '# AGENTS',
      '## 文件/目录权限',
      'src/',
      '## 提交规范',
      'feat: / fix:',
      '## 测试要求',
      '80%',
      '## 升级条件',
      '跨模块变更须升级',
      '## 跨模块规则',
      '只读 API.md',
      '## 决策记录机制',
      '仅评审时加载 DECISIONS.md',
      '## 模块目录说明',
      'API.md 只读，DESIGN.md 可写',
      '## PLAN.md 任务规范',
      '参考 PLAN.md',
    ].join('\n'),
    'utf-8',
  );

  for (const m of moduleDirs) {
    const modPath = path.join(docsDir, 'modules', m);
    fs.mkdirSync(modPath, { recursive: true });
    fs.writeFileSync(
      path.join(modPath, 'API.md'),
      [
        `# ${m} 模块接口`,
        '## 模块概述与职责边界',
        '职责。',
        '## 核心数据结构',
        '- entity: { id }',
        '## 接口定义',
        '- GET /ping',
      ].join('\n'),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(modPath, 'DESIGN.md'),
      [
        `# ${m} 模块内部实现`,
        '## 核心逻辑流程',
        '流程。',
        '## 内部实现细节',
        '细节。',
        '## 功能特性列表',
        `### ${m.split('-').slice(1).join('-').toUpperCase()}-F001: 接口`,
        '实现端点。',
        '',
        '- 对应需求: REQ-AUTH-001',
      ].join('\n'),
      'utf-8',
    );
  }

  // Include DECISIONS.md with valid frontmatter and required sections
  fs.writeFileSync(
    path.join(docsDir, 'DECISIONS.md'),
    [
      '---',
      'name: test-project',
      'description: "Test decisions"',
      'metadata.author: test',
      'metadata.version: 1.0.0',
      '---',
      '',
      '## 理由',
      '该决策被拒绝。',
      '',
      '## 取消条件',
      '当需求变更时重新评估。',
    ].join('\n'),
    'utf-8',
  );

  if (overrides.withSkill) {
    const skillDir = path.join(root, 'opensdd');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      [
        '---',
        'name: opensdd',
        'description: "Test skill"',
        'metadata.author: test',
        'metadata.version: 1.0.0',
        '---',
        '',
      ].join('\n'),
      'utf-8',
    );

    const checkPkgDir = path.join(root, 'opensdd', 'opensdd-check');
    fs.mkdirSync(checkPkgDir, { recursive: true });
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(checkPkgDir, 'package.json'),
      JSON.stringify({ name: 'opensdd-check', version: '1.0.0' }, null, 2),
      'utf-8',
    );
  }

  return {
    root,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

module.exports = { createValidProject };

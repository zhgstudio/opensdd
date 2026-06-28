'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const check = require('../checks/agents');
const { DEFAULT_CONFIG } = require('../config');

describe('AGENTS_SECTIONS check', () => {
  /** @type {string} */
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-agents-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should pass when all required sections have matching headings', async () => {
    const agentsContent = `# AGENTS.md

## 文件/目录权限
Defines file/directory permissions for the agent.

## 提交规范
Commit conventions and message format.

## 测试要求
Test requirements and coverage expectations.

## 升级条件
Human intervention and escalation conditions.

## 跨模块规则
Cross-module interaction rules.

## 决策记录机制
Decision record mechanism.

## 模块目录说明
Module directory structure.

## PLAN.md 任务规范
Task planning conventions and PLAN.md references.
`;
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), agentsContent, 'utf-8');

    const result = await check(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'pass');
    assert.strictEqual(result.name, 'AGENTS_SECTIONS');
  });

  it('should fail when the same keywords appear only in body text (not headings)', async () => {
    // Keywords are in the body but NOT as ## headings
    const agentsContent = `# AGENTS.md

## Introduction
This document covers the quality acceptance standards for the project.
It also describes the file operation scope that agents must follow.

## Development
All commit specification details are here.
We enforce test coverage requirements across all modules.

## Operations
Escalation conditions and human intervention steps are documented.
Cross-module rules apply when working across module boundaries.

## Planning
Refer to plan.md for task conventions.
`;
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), agentsContent, 'utf-8');

    const result = await check(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'fail');
    assert.strictEqual(result.name, 'AGENTS_SECTIONS');
  });

  it('should skip when AGENTS.md does not exist', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-agents-nofile-'));
    try {
      const result = await check(emptyDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'skip');
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('should handle partial section coverage', async () => {
    // Only one heading that matches
    const agentsContent = `# AGENTS.md

## 质量验收标准
Some content here.

## Other Stuff
Random content.
`;
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), agentsContent, 'utf-8');

    const result = await check(tmpDir, DEFAULT_CONFIG);
    assert.strictEqual(result.status, 'fail');
    assert.ok(result.messages[0].includes('Missing sections'));
  });
});

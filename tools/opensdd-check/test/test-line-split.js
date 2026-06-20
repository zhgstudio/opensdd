'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { splitLines } = require('../lib/line-split');

describe('splitLines (CRLF compatibility)', () => {
  it('should split by LF', () => {
    assert.deepStrictEqual(splitLines('a\nb\nc'), ['a', 'b', 'c']);
  });

  it('should split by CRLF', () => {
    assert.deepStrictEqual(splitLines('a\r\nb\r\nc'), ['a', 'b', 'c']);
  });

  it('should handle empty string', () => {
    assert.deepStrictEqual(splitLines(''), ['']);
  });

  it('should handle single line without newline', () => {
    assert.deepStrictEqual(splitLines('hello'), ['hello']);
  });

  it('should handle trailing newline', () => {
    assert.deepStrictEqual(splitLines('a\nb\n'), ['a', 'b', '']);
  });

  it('should handle trailing CRLF', () => {
    assert.deepStrictEqual(splitLines('a\r\nb\r\n'), ['a', 'b', '']);
  });

  it('should handle mixed line endings', () => {
    assert.deepStrictEqual(splitLines('a\r\nb\nc\r\nd'), ['a', 'b', 'c', 'd']);
  });
});

describe('CRLF handling in checks', () => {
  const DEFAULT_CONFIG = require('../config').DEFAULT_CONFIG;

  it('PLAN_FORMAT should work with CRLF content', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-crlf-plan-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'docs', 'PLAN.md'),
        '# Plan\r\n\r\n- [ ] T-001: First task\r\n- [x] T-002: Second task\r\n',
        'utf-8',
      );
      const check = require('../checks/plan');
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('AGENTS_SECTIONS should work with CRLF content', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-crlf-agents-'));
    try {
      const agentsContent =
        '# AGENTS.md\r\n\r\n## 文件操作范围\r\nContent\r\n\r\n## 提交规范\r\nContent\r\n\r\n## 测试要求\r\nContent\r\n\r\n## 升级条件\r\nContent\r\n\r\n## 跨模块规则\r\nContent\r\n\r\n## 任务规范\r\nContent\r\n';
      fs.writeFileSync(path.join(dir, 'AGENTS.md'), agentsContent, 'utf-8');
      const check = require('../checks/agents');
      const result = await check(dir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('TBD_RESIDUAL should work with CRLF content', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-crlf-tbd-'));
    try {
      fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'docs', 'ARCHITECTURE.md'),
        '# Architecture\r\n\r\n## 模块依赖矩阵\r\n| 模块 | 依赖 | 所需接口 |\r\n|---|---|---|\r\n| 02-task-core | 01-auth | [TBD: role auth] |\r\n',
        'utf-8',
      );
      const check = require('../checks/tbd-residual');
      const result = check(dir, {});
      assert.strictEqual(result.status, 'fail');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

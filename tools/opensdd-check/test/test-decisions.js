'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const check = require('../checks/decisions');

describe('DECISIONS_FORMAT check', () => {
  it('should skip when DECISIONS.md does not exist', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-dec-skip-'));
    try {
      const result = check(dir);
      assert.strictEqual(result.status, 'skip');
      assert.strictEqual(result.name, 'DECISIONS_FORMAT');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should pass when DECISIONS.md has valid frontmatter and required sections', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-dec-pass-'));
    try {
      const docsDir = path.join(dir, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(
        path.join(docsDir, 'DECISIONS.md'),
        [
          '---',
          'name: test-project',
          'description: "Test decisions"',
          '---',
          '',
          '## 理由',
          '该决策因技术债务被拒绝。',
          '',
          '## 取消条件',
          '当性能瓶颈出现时重新评估。',
        ].join('\n'),
        'utf-8',
      );
      const result = check(dir);
      assert.strictEqual(result.status, 'pass');
      assert.strictEqual(result.name, 'DECISIONS_FORMAT');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should warn when frontmatter is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-dec-nofm-'));
    try {
      const docsDir = path.join(dir, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'DECISIONS.md'), '# Decision Records\n\n## 理由\n内容。\n', 'utf-8');
      const result = check(dir);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages.some((m) => m.includes('Missing YAML frontmatter')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should warn when required sections are missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-dec-nosec-'));
    try {
      const docsDir = path.join(dir, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(
        path.join(docsDir, 'DECISIONS.md'),
        ['---', 'name: test', '---', '', '# Only a heading'].join('\n'),
        'utf-8',
      );
      const result = check(dir);
      assert.strictEqual(result.status, 'warn');
      assert.ok(result.messages.some((m) => m.includes('Missing required section')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

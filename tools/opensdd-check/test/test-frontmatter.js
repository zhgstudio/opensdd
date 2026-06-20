'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('FRONTMATTER check', () => {
  /** @type {string} */
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-fm-'));
    fs.mkdirSync(path.join(tmpDir, 'opensdd'), { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should pass when all skill files have valid frontmatter', () => {
    const check = require('../checks/frontmatter');
    fs.writeFileSync(
      path.join(tmpDir, 'opensdd', 'SKILL.md'),
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
    const result = check(tmpDir);
    assert.strictEqual(result.status, 'pass');
  });

  it('should warn when frontmatter is missing', () => {
    const check = require('../checks/frontmatter');
    fs.writeFileSync(path.join(tmpDir, 'opensdd', 'SKILL.md'), '# No frontmatter here', 'utf-8');
    const result = check(tmpDir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages.some((m) => m.includes('missing YAML frontmatter')));
  });

  it('should warn when frontmatter has no closing ---', () => {
    const check = require('../checks/frontmatter');
    fs.writeFileSync(
      path.join(tmpDir, 'opensdd', 'SKILL.md'),
      ['---', 'name: opensdd', 'description: "Test"', 'metadata.author: test', 'metadata.version: 1.0.0'].join('\n'),
      'utf-8',
    );
    const result = check(tmpDir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages.some((m) => m.includes('no closing ---')));
  });

  it('should warn when frontmatter lacks required fields', () => {
    const check = require('../checks/frontmatter');
    fs.writeFileSync(path.join(tmpDir, 'opensdd', 'SKILL.md'), ['---', 'name: opensdd', '---', ''].join('\n'), 'utf-8');
    const result = check(tmpDir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages.some((m) => m.includes('description')));
    assert.ok(result.messages.some((m) => m.includes('metadata.author')));
    assert.ok(result.messages.some((m) => m.includes('metadata.version')));
  });

  it('should skip when opensdd/ directory does not exist', () => {
    const check = require('../checks/frontmatter');
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-fm-empty-'));
    const result = check(emptyDir);
    assert.strictEqual(result.status, 'skip');
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });
});

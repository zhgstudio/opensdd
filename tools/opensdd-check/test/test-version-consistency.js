'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { DEFAULT_CONFIG } = require('../config');
const { extractFrontmatterVersion } = require('../checks/version-consistency');

describe('extractFrontmatterVersion', () => {
  it('should extract dot-notation metadata.version', () => {
    const fm = 'name: opensdd\ndescription: "test"\nmetadata.author: zhg\nmetadata.version: 3.3.0\n';
    assert.strictEqual(extractFrontmatterVersion(fm), '3.3.0');
  });

  it('should extract nested YAML version under metadata:', () => {
    const fm = 'name: opensdd\nmetadata:\n  author: zhg\n  version: 2.1.0\n';
    assert.strictEqual(extractFrontmatterVersion(fm), '2.1.0');
  });

  it('should extract version with quoted value', () => {
    const fm = 'metadata.version: "1.0.0"\n';
    assert.strictEqual(extractFrontmatterVersion(fm), '1.0.0');
  });

  it('should extract version with single-quoted value', () => {
    const fm = "metadata.version: '0.5.0-beta'\n";
    assert.strictEqual(extractFrontmatterVersion(fm), '0.5.0-beta');
  });

  it('should return null when version is missing', () => {
    const fm = 'name: opensdd\ndescription: "test"\n';
    assert.strictEqual(extractFrontmatterVersion(fm), null);
  });

  it('should return null for empty frontmatter', () => {
    assert.strictEqual(extractFrontmatterVersion(''), null);
  });

  it('should handle pre-release version strings', () => {
    const fm = 'metadata.version: 3.3.0-alpha.1\n';
    assert.strictEqual(extractFrontmatterVersion(fm), '3.3.0-alpha.1');
  });

  it('should not confuse other keys named "version" outside metadata', () => {
    const fm = 'name: opensdd\napi-version: 2\nmetadata:\n  version: 1.2.3\nother-version: 4\n';
    assert.strictEqual(extractFrontmatterVersion(fm), '1.2.3');
  });

  it('should handle deeply nested version under metadata', () => {
    const fm = 'metadata:\n  author:\n    name: zhg\n  version: 5.0.0\n';
    assert.strictEqual(extractFrontmatterVersion(fm), '5.0.0');
  });
});

describe('VERSION_CONSISTENCY check', () => {
  const check = require('../checks/version-consistency');

  function createProject(versions) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-ver-'));
    const skillDir = path.join(root, 'opensdd');
    fs.mkdirSync(skillDir, { recursive: true });

    if (versions.skill !== undefined) {
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        [
          '---',
          'name: opensdd',
          'description: "test"',
          'metadata.author: test',
          `metadata.version: ${versions.skill}`,
          '---',
          '',
        ].join('\n'),
        'utf-8',
      );
    }

    if (versions.root !== undefined) {
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({ name: 'test', version: versions.root }),
        'utf-8',
      );
    }

    if (versions.check !== undefined) {
      const checkDir = path.join(root, 'tools', 'opensdd-check');
      fs.mkdirSync(checkDir, { recursive: true });
      fs.writeFileSync(
        path.join(checkDir, 'package.json'),
        JSON.stringify({ name: 'opensdd-check', version: versions.check }),
        'utf-8',
      );
    }

    return root;
  }

  it('should pass when all three versions match', async () => {
    const root = createProject({ skill: '1.2.3', root: '1.2.3', check: '1.2.3' });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when SKILL.md and root package.json mismatch', async () => {
    const root = createProject({ skill: '2.0.0', root: '2.1.0', check: '2.0.0' });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('MISMATCH')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fail when SKILL.md and check package.json mismatch', async () => {
    const root = createProject({ skill: '3.0.0', root: '3.0.0', check: '3.0.1' });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('MISMATCH')));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should skip when SKILL.md is missing', async () => {
    const root = createProject({ root: '1.0.0', check: '1.0.0' });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'skip');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should warn when package.json files are missing', async () => {
    const root = createProject({ skill: '1.0.0' });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'warn');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should handle nested YAML frontmatter format', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-ver-'));
    try {
      const skillDir = path.join(root, 'opensdd');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        [
          '---',
          'name: opensdd',
          'metadata:',
          '  author: zhg',
          '  version: 4.5.6',
          '---',
          '',
        ].join('\n'),
        'utf-8',
      );
      const checkDir = path.join(root, 'tools', 'opensdd-check');
      fs.mkdirSync(checkDir, { recursive: true });
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({ name: 'test', version: '4.5.6' }),
        'utf-8',
      );
      fs.writeFileSync(
        path.join(checkDir, 'package.json'),
        JSON.stringify({ name: 'opensdd-check', version: '4.5.6' }),
        'utf-8',
      );
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should report all sources in pass message', async () => {
    const root = createProject({ skill: '0.0.1', root: '0.0.1', check: '0.0.1' });
    try {
      const result = await check(root, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
      assert.ok(result.messages[0].includes('3 sources'));
      assert.ok(result.messages[0].includes('0.0.1'));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

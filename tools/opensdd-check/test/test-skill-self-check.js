'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function readFile(rel) {
  const fp = path.join(REPO_ROOT, rel);
  try {
    return fs.readFileSync(fp, 'utf-8');
  } catch {
    return null;
  }
}

describe('SKILL.md self-check', () => {
  const skillPath = 'opensdd/SKILL.md';

  it('SKILL.md should exist', () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, skillPath)), 'SKILL.md not found');
  });

  it('SKILL.md referenced phase files should exist', () => {
    const content = readFile(skillPath);
    assert.ok(content, 'Could not read SKILL.md');

    const expectedRefs = ['phase-1.md', 'phase-2.md', 'phase-3.md', 'phase-4.md', 'finalization.md'];
    const opensddDir = path.join(REPO_ROOT, 'opensdd');

    for (const ref of expectedRefs) {
      assert.ok(
        fs.existsSync(path.join(opensddDir, ref)),
        `Referenced file opensdd/${ref} does not exist`,
      );
    }
  });

  it('SKILL.md version should match root package.json version', () => {
    const skillContent = readFile(skillPath);
    const pkgContent = readFile('package.json');
    assert.ok(skillContent, 'Could not read SKILL.md');
    assert.ok(pkgContent, 'Could not read package.json');

    const pkg = JSON.parse(pkgContent);
    const pkgVersion = pkg.version;

    const fm = skillContent.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(fm, 'No YAML frontmatter found in SKILL.md');
    const yaml = fm[1];

    // Support both flat (metadata.version: X) and nested (metadata:\n  version: X) YAML formats
    const flatMatch = yaml.match(/^metadata\.version\s*:\s*["']?([\d.]+)["']?/m);
    const nestedMatch = yaml.match(/^\s+version\s*:\s*["']?([\d.]+)["']?/m);
    const version = flatMatch?.[1] || nestedMatch?.[1];

    assert.ok(version, 'metadata.version not found in SKILL.md frontmatter');
    assert.strictEqual(
      version,
      pkgVersion,
      `SKILL.md version (${version}) != package.json version (${pkgVersion})`,
    );
  });

  it('SKILL.md frontmatter should have name, description, metadata.author, metadata.version', () => {
    const content = readFile(skillPath);
    assert.ok(content, 'Could not read SKILL.md');

    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, 'No YAML frontmatter found');

    const fm = frontmatter[1];
    assert.ok(/^name\s*:/m.test(fm), 'Missing name');
    assert.ok(/^description\s*:/m.test(fm), 'Missing description');

    const hasAuthor =
      /^metadata\.author\s*:/m.test(fm) ||
      /^metadata:\s*\n(?:[ \t]+.*\n)*[ \t]+author\s*:/m.test(fm);
    const hasVersion =
      /^metadata\.version\s*:/m.test(fm) ||
      /^metadata:\s*\n(?:[ \t]+.*\n)*[ \t]+version\s*:/m.test(fm);
    assert.ok(hasAuthor, 'Missing metadata.author');
    assert.ok(hasVersion, 'Missing metadata.version');
  });

  it('AGENTS.md should exist at repo root', () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'AGENTS.md')), 'Root AGENTS.md not found');
  });

  it('root package.json should have engines field', () => {
    const content = readFile('package.json');
    assert.ok(content, 'Could not read package.json');
    const pkg = JSON.parse(content);
    assert.ok(pkg.engines, 'Missing engines field in root package.json');
    assert.ok(pkg.engines.node, 'Missing engines.node in root package.json');
  });
});

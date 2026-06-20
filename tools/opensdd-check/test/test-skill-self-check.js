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
      assert.ok(fs.existsSync(path.join(opensddDir, ref)), `Referenced file opensdd/${ref} does not exist`);
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
    assert.strictEqual(version, pkgVersion, `SKILL.md version (${version}) != package.json version (${pkgVersion})`);
  });

  it('SKILL.md frontmatter should have name, description, metadata.author, metadata.version', () => {
    const content = readFile(skillPath);
    assert.ok(content, 'Could not read SKILL.md');

    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, 'No YAML frontmatter found');

    const fm = frontmatter[1];
    assert.ok(/^name\s*:/m.test(fm), 'Missing name');
    assert.ok(/^description\s*:/m.test(fm), 'Missing description');

    const hasAuthor = /^metadata\.author\s*:/m.test(fm) || /^metadata:\s*\n(?:[ \t]+.*\n)*[ \t]+author\s*:/m.test(fm);
    const hasVersion =
      /^metadata\.version\s*:/m.test(fm) || /^metadata:\s*\n(?:[ \t]+.*\n)*[ \t]+version\s*:/m.test(fm);
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

  it('all registered checks should have valid require path in index.js', () => {
    const indexPath = path.join(REPO_ROOT, 'tools', 'opensdd-check', 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Extract all require('./checks/...') statements
    const checkReqs = [];
    const checkRegex = /require\(['"]\.\/checks\/([^'"]+)['"]\)/g;
    let match;
    while ((match = checkRegex.exec(indexContent)) !== null) {
      checkReqs.push(match[1]);
    }

    assert.ok(checkReqs.length >= 11, `Expected at least 11 checks, found ${checkReqs.length}`);

    for (const mod of checkReqs) {
      const modPath = path.join(REPO_ROOT, 'tools', 'opensdd-check', 'checks', `${mod}.js`);
      assert.ok(fs.existsSync(modPath), `Check module file not found: checks/${mod}.js`);
    }
  });

  it('help text should list all registered check names from loaded modules', () => {
    const indexPath = path.join(REPO_ROOT, 'tools', 'opensdd-check', 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Extract module paths from require('./checks/...') calls
    const checkModules = [];
    const requireRegex = /require\(['"]\.\/checks\/([^'"]+)['"]\)/g;
    let m;
    while ((m = requireRegex.exec(indexContent)) !== null) {
      checkModules.push(m[1]);
    }

    assert.ok(checkModules.length >= 11, `Expected at least 11 check modules, found ${checkModules.length}`);

    // Load each module and get its returned .name to verify it appears in help text
    const checksDir = path.join(REPO_ROOT, 'tools', 'opensdd-check', 'checks');
    const returnNames = [];
    for (const mod of checkModules) {
      const modPath = path.join(checksDir, `${mod}.js`);
      assert.ok(fs.existsSync(modPath), `Module file not found: checks/${mod}.js`);

      const checkFn = require(modPath);
      const result = checkFn(REPO_ROOT, {
        requiredFiles: [],
        requiredAgentSections: [],
        taskRegex: '',
        moduleDirPattern: '',
        requiredApiSections: [],
        requiredDesignSections: [],
        interfaceStrategy: 'auto',
      });
      returnNames.push(result.name);
    }

    const helpSection = indexContent.match(/CHECKS[\s\S]*?`\);/);
    assert.ok(helpSection, 'Help text section not found in index.js');

    for (const name of returnNames) {
      assert.ok(helpSection[0].includes(name), `Help text does not mention check "${name}"`);
    }
  });

  it('all registered checks should be called in main() results array', () => {
    const indexPath = path.join(REPO_ROOT, 'tools', 'opensdd-check', 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    const varMap = [];
    const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]\.\/checks\/([^'"]+)['"]\)/g;
    let m;
    while ((m = requireRegex.exec(indexContent)) !== null) {
      varMap.push({ varName: m[1], modName: m[2] });
    }

    const resultsSection = indexContent.match(/const results = \[[\s\S]*?\];/);
    assert.ok(resultsSection, 'Results array not found in index.js');

    for (const { varName, modName } of varMap) {
      assert.ok(
        resultsSection[0].includes(varName),
        `Check variable "${varName}" (from checks/${modName}.js) not found in results array`,
      );
    }
  });
});

'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('TRACEABILITY', () => {
  const check = require('../checks/traceability');

  /** @type {string[]} */
  const tmpDirs = [];

  function createProjectStructure(specReqs, featuresByModule, reqRefsByModule) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-trace-'));
    tmpDirs.push(tmpDir);

    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });

    // SPEC.md
    const specContent = ['# SPEC', ...specReqs.map((id) => `- ${id}: some requirement`)].join('\n');
    fs.writeFileSync(path.join(docsDir, 'SPEC.md'), specContent, 'utf-8');

    // Modules with DESIGN.md
    for (const [moduleName, features] of Object.entries(featuresByModule)) {
      const modDir = path.join(docsDir, 'modules', moduleName);
      fs.mkdirSync(modDir, { recursive: true });
      const refs = (reqRefsByModule && reqRefsByModule[moduleName]) || [];
      const designContent = [
        `# ${moduleName} design`,
        '## \u529f\u80fd\u7279\u6027\u5217\u8868',
        ...features.map((f) => `### ${f}: some feature`),
        ...refs.map((r) => `- \u5bf9\u5e94\u9700\u6c42: ${r}`),
      ].join('\n');
      fs.writeFileSync(path.join(modDir, 'DESIGN.md'), designContent, 'utf-8');
    }

    return tmpDir;
  }

  afterEach(() => {
    for (const d of tmpDirs) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {}
    }
    tmpDirs.length = 0;
  });

  it('should skip when SPEC.md does not exist', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-trace-'));
    tmpDirs.push(dir);

    const result = await check(dir);
    assert.strictEqual(result.status, 'skip');
  });

  it('should pass when REQs and features both exist with REQ references in DESIGN.md', async () => {
    const dir = createProjectStructure(
      ['REQ-AUTH-001', 'REQ-AUTH-002'],
      { '01-auth': ['AUTH-F001', 'AUTH-F002'] },
      { '01-auth': ['REQ-AUTH-001', 'REQ-AUTH-002'] },
    );
    const result = await check(dir);
    assert.strictEqual(result.status, 'pass');
  });

  it('should pass with multi-word MODULE feature IDs (e.g., TASK-CORE-F001)', async () => {
    const dir = createProjectStructure(
      ['REQ-TASK-001', 'REQ-TASK-002'],
      { '02-task-core': ['TASK-CORE-F001', 'TASK-CORE-F005'] },
      { '02-task-core': ['REQ-TASK-001', 'REQ-TASK-002'] },
    );
    const result = await check(dir);
    assert.strictEqual(result.status, 'pass');
  });

  it('should warn when REQs exist but no features', async () => {
    const dir = createProjectStructure(['REQ-AUTH-001', 'REQ-AUTH-002'], {});
    const result = await check(dir);
    assert.strictEqual(result.status, 'warn');

    const msgs = result.messages.join(' ');
    assert.ok(msgs.includes('2 requirement(s)'));
    assert.ok(msgs.includes('no features'));
  });

  it('should warn when REQs exist but are not referenced in any DESIGN.md', async () => {
    const dir = createProjectStructure(['REQ-AUTH-001'], { '01-auth': ['AUTH-F001'] });
    const result = await check(dir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages[0].includes('not referenced in any DESIGN.md'));
  });

  it('should warn when features exist but no REQs', async () => {
    const dir = createProjectStructure([], { '01-auth': ['AUTH-F001'] });
    const result = await check(dir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages[0].includes('1 feature(s)'));
    assert.ok(result.messages[0].includes('no requirements'));
  });

  it('should pass when neither REQs nor features exist', async () => {
    const dir = createProjectStructure([], {});
    const result = await check(dir);
    assert.strictEqual(result.status, 'pass');
  });
});

'use strict';

const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('TRACEABILITY', () => {
  const check = require('../checks/traceability');

  /** @type {string} */
  let tmpDir;

  function createProjectStructure(specReqs, featuresByModule, reqRefsByModule) {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-trace-'));

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
  }

  function cleanup() {
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  after(cleanup);

  it('should skip when SPEC.md does not exist', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-trace-'));

    const result = await check(tmpDir);
    assert.strictEqual(result.status, 'skip');
  });

  it('should pass when REQs and features both exist with REQ references in DESIGN.md', async () => {
    createProjectStructure(
      ['REQ-001', 'REQ-002'],
      { '01-auth': ['01-F001', '01-F002'] },
      { '01-auth': ['REQ-001', 'REQ-002'] },
    );
    const result = await check(tmpDir);
    assert.strictEqual(result.status, 'pass');
  });

  it('should warn when REQs exist but no features', async () => {
    createProjectStructure(['REQ-001', 'REQ-002'], {});
    const result = await check(tmpDir);
    assert.strictEqual(result.status, 'warn');

    const msgs = result.messages.join(' ');
    assert.ok(msgs.includes('2 requirement(s)'));
    assert.ok(msgs.includes('no features'));
  });

  it('should warn when REQs exist but are not referenced in any DESIGN.md', async () => {
    createProjectStructure(['REQ-001'], { '01-auth': ['01-F001'] });
    const result = await check(tmpDir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages[0].includes('not referenced in any DESIGN.md'));
  });

  it('should warn when features exist but no REQs', async () => {
    createProjectStructure([], { '01-auth': ['01-F001'] });
    const result = await check(tmpDir);
    assert.strictEqual(result.status, 'warn');
    assert.ok(result.messages[0].includes('1 feature(s)'));
    assert.ok(result.messages[0].includes('no requirements'));
  });

  it('should pass when neither REQs nor features exist', async () => {
    createProjectStructure([], {});
    const result = await check(tmpDir);
    assert.strictEqual(result.status, 'pass');
  });
});

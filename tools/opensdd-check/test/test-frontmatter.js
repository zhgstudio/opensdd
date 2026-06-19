'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  // Create temp directory with test skill files
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-fm-'));
  const skillsDir = path.join(tmpDir, 'opensdd');
  fs.mkdirSync(skillsDir, { recursive: true });

  // Valid frontmatter file
  fs.writeFileSync(
    path.join(skillsDir, 'SKILL.md'),
    `---
name: opensdd
description: "Test skill"
metadata:
  author: test
  version: 1.0.0
---

# Test
`,
  );

  // Missing frontmatter
  fs.writeFileSync(
    path.join(skillsDir, 'phase-1.md'),
    `# No frontmatter
`,
  );

  // Partial frontmatter
  fs.writeFileSync(
    path.join(skillsDir, 'phase-2.md'),
    `---
name: phase2
---

# Partial
`,
  );

  const check = require('../checks/frontmatter');
  const result = await check(tmpDir, {});

  assert.strictEqual(result.name, 'FRONTMATTER');
  assert.strictEqual(result.status, 'warn');
  assert.ok(result.messages.length >= 2, `Expected 2+ issues, got ${result.messages.length}`);

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('  PASS frontmatter check');
}

run().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

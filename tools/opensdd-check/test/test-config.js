'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  const { loadConfig, DEFAULT_CONFIG } = require('../config');

  // Test 1: Default config when no .sddrc.json
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-cfg-'));
  const config1 = loadConfig(tmpDir);
  assert.deepStrictEqual(config1.requiredFiles, DEFAULT_CONFIG.requiredFiles);
  console.log('  PASS: default config returned when no .sddrc.json');

  // Test 2: User config merges arrays
  const configPath = path.join(tmpDir, '.sddrc.json');
  fs.writeFileSync(configPath, JSON.stringify({ requiredFiles: ['docs/EXTRA.md'] }));
  const config2 = loadConfig(tmpDir);
  assert.ok(config2.requiredFiles.includes('docs/SPEC.md'), 'should include default files');
  assert.ok(config2.requiredFiles.includes('docs/EXTRA.md'), 'should include user files');
  console.log('  PASS: arrays are extended, not replaced');

  // Test 3: Invalid JSON falls back to defaults
  fs.writeFileSync(configPath, 'not json');
  const config3 = loadConfig(tmpDir);
  assert.deepStrictEqual(config3.requiredFiles, DEFAULT_CONFIG.requiredFiles);
  console.log('  PASS: invalid JSON falls back to defaults');

  // Test 4: String fields override
  fs.writeFileSync(configPath, JSON.stringify({ taskRegex: '^custom$' }));
  const config4 = loadConfig(tmpDir);
  assert.strictEqual(config4.taskRegex, '^custom$');
  console.log('  PASS: string fields override defaults');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('  All config tests PASS');
}

run().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

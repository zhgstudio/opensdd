'use strict';

const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const { report } = require('../lib/reporter');

describe('reporter', () => {
  const passResults = [
    { name: 'FILE_EXISTS', status: 'pass', messages: ['All files ok'], _root: '/test' },
    { name: 'PLAN_FORMAT', status: 'pass', messages: ['5 tasks ok'], _root: '/test' },
  ];

  const failResults = [
    { name: 'FILE_EXISTS', status: 'fail', messages: ['Missing SPEC.md'], _root: '/test' },
    { name: 'PLAN_FORMAT', status: 'pass', messages: ['5 tasks ok'], _root: '/test' },
  ];

  const warnResults = [
    { name: 'DEP_MATRIX', status: 'warn', messages: ['Some warnings'], _root: '/test' },
    { name: 'PLAN_FORMAT', status: 'pass', messages: ['5 tasks ok'], _root: '/test' },
  ];

  it('should return 0 when all pass', () => {
    mock.method(console, 'log', () => {});
    const exitCode = report(passResults, { json: false, strict: false });
    mock.restoreAll();
    assert.strictEqual(exitCode, 0);
  });

  it('should return 1 when any fail', () => {
    mock.method(console, 'log', () => {});
    const exitCode = report(failResults, { json: false, strict: false });
    mock.restoreAll();
    assert.strictEqual(exitCode, 1);
  });

  it('should return 1 in strict mode for warnings', () => {
    mock.method(console, 'log', () => {});
    const exitCode = report(warnResults, { json: false, strict: true });
    mock.restoreAll();
    assert.strictEqual(exitCode, 1);
  });

  it('should return 0 in non-strict mode for warnings', () => {
    mock.method(console, 'log', () => {});
    const exitCode = report(warnResults, { json: false, strict: false });
    mock.restoreAll();
    assert.strictEqual(exitCode, 0);
  });

  it('should output valid JSON with projectRoot and timestamp', () => {
    const logs = [];
    mock.method(console, 'log', (msg) => logs.push(msg));

    const exitCode = report(passResults, { json: true, strict: false });
    mock.restoreAll();

    assert.strictEqual(exitCode, 0);
    const jsonOutput = JSON.parse(logs[0]);
    assert.strictEqual(typeof jsonOutput.projectRoot, 'string');
    assert.ok(jsonOutput.timestamp);
    assert.strictEqual(jsonOutput.summary.passed, 2);
  });

  it('JSON projectRoot should reflect user-specified path', () => {
    const logs = [];
    mock.method(console, 'log', (msg) => logs.push(msg));

    const customResults = [{ name: 'FILE_EXISTS', status: 'pass', messages: ['All files ok'], _root: '/custom/path' }];
    report(customResults, { json: true, strict: false });
    mock.restoreAll();

    const jsonOutput = JSON.parse(logs[0]);
    assert.strictEqual(jsonOutput.projectRoot, '/custom/path');
  });

  it('terminal report should show PASSED on all pass', () => {
    const logs = [];
    mock.method(console, 'log', (msg) => logs.push(msg));

    report(passResults, { json: false, strict: false });
    mock.restoreAll();

    assert.ok(logs.some((l) => l.includes('PASSED')));
  });

  it('terminal report should show FAILED on any fail', () => {
    const logs = [];
    mock.method(console, 'log', (msg) => logs.push(msg));

    report(failResults, { json: false, strict: false });
    mock.restoreAll();

    assert.ok(logs.some((l) => l.includes('FAILED')));
  });
});

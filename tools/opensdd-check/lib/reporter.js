'use strict';

/**
 * @typedef {{name: string, status: string, messages: string[], _root?: string}} CheckResult
 */

const C = {
  /** @param {string} s */
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  /** @param {string} s */
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  /** @param {string} s */
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  /** @param {string} s */
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  /** @param {string} s */
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/**
 * Return colored status icon for terminal output.
 *
 * @param {string} status - One of 'pass', 'fail', 'warn', 'skip'
 * @returns {string} Colored icon string
 */
function statusIcon(status) {
  switch (status) {
    case 'pass':
      return C.green('[PASS]');
    case 'fail':
      return C.red('[FAIL]');
    case 'warn':
      return C.yellow('[WARN]');
    case 'skip':
      return C.dim('[SKIP]');
    default:
      return `[${status.toUpperCase()}]`;
  }
}

/**
 * Generate colored terminal report from check results.
 *
 * @param {CheckResult[]} results - Array of check results
 * @param {boolean} strict - Whether to treat warnings as errors
 * @returns {number} Exit code (0 = pass, 1 = fail)
 */
function terminalReport(results, strict) {
  const root = results.length > 0 ? results[0]._root || process.cwd() : process.cwd();
  console.log(`\nSDD Check Report — ${root}`);
  console.log('━'.repeat(50));

  let errors = 0;
  let warnings = 0;

  for (const r of results) {
    const icon = statusIcon(r.status);
    const msg = r.messages[0] || '';
    const summary = `${icon}  ${r.name.padEnd(16)} ${msg}`;
    console.log(summary);

    // additional messages indented
    for (let i = 1; i < r.messages.length; i++) {
      console.log(`  ${C.dim('→')} ${r.messages[i]}`);
    }

    if (r.status === 'fail') errors++;
    else if (r.status === 'warn') warnings++;
  }

  console.log('━'.repeat(50));
  const verdict = errors > 0 || (strict && warnings > 0) ? C.red('FAILED') : C.green('PASSED');
  const strictLabel = strict ? ' (strict mode)' : '';
  console.log(`Result: ${verdict} — ${errors} error(s), ${warnings} warning(s)${strictLabel}\n`);

  return errors > 0 || (strict && warnings > 0) ? 1 : 0;
}

/**
 * Generate JSON report from check results.
 *
 * @param {CheckResult[]} results - Array of check results
 * @param {boolean} strict - Whether to treat warnings as errors
 * @returns {number} Exit code (0 = pass, 1 = fail)
 */
function jsonReport(results, strict) {
  let errors = 0;
  let warnings = 0;
  let passed = 0;

  for (const r of results) {
    if (r.status === 'pass') passed++;
    else if (r.status === 'fail') errors++;
    else if (r.status === 'warn') warnings++;
  }

  const output = {
    projectRoot: results.length > 0 ? results[0]._root || process.cwd() : process.cwd(),
    timestamp: new Date().toISOString(),
    summary: { passed, failed: errors, warnings },
    strict,
    results: results.map((r) => ({
      name: r.name,
      status: r.status,
      messages: r.messages,
    })),
  };

  // strip internal _root before serializing
  for (const r of output.results) {
    delete r._root;
  }

  console.log(JSON.stringify(output, null, 2));
  return errors > 0 || (strict && warnings > 0) ? 1 : 0;
}

/**
 * Generate report from check results (terminal or JSON).
 *
 * @param {CheckResult[]} results - Array of check results
 * @param {{json?: boolean, strict?: boolean}} [opts] - Reporting options
 * @returns {number} Exit code (0 = pass, 1 = fail)
 */
module.exports.report = function report(results, opts = {}) {
  if (opts.json) {
    // strip internal _root before serializing
    const clean = results.map((r) => {
      const copy = { ...r };
      delete copy._root;
      return copy;
    });
    return jsonReport(clean, opts.strict);
  }
  return terminalReport(results, opts.strict);
};

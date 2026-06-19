'use strict';

const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

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

function terminalReport(results, strict, root) {
  console.log(`\nSDD Check Report — ${root}`);
  console.log('━'.repeat(50));

  let errors = 0;
  let warnings = 0;

  for (const r of results) {
    const icon = statusIcon(r.status);
    const msg = r.messages[0] || '';
    const summary = `${icon}  ${r.name.padEnd(16)} ${msg}`;
    console.log(summary);

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

function jsonReport(results, strict, projectRoot) {
  let errors = 0;
  let warnings = 0;
  let passed = 0;

  for (const r of results) {
    if (r.status === 'pass') passed++;
    else if (r.status === 'fail') errors++;
    else if (r.status === 'warn') warnings++;
  }

  const output = {
    projectRoot: projectRoot || process.cwd(),
    timestamp: new Date().toISOString(),
    summary: { passed, failed: errors, warnings },
    strict,
    results: results.map((r) => ({
      name: r.name,
      status: r.status,
      messages: r.messages,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
  return errors > 0 || (strict && warnings > 0) ? 1 : 0;
}

module.exports.report = function report(results, opts = {}) {
  const root = opts.root || process.cwd();
  if (opts.json) {
    return jsonReport(results, opts.strict, root);
  }
  return terminalReport(results, opts.strict, root);
};

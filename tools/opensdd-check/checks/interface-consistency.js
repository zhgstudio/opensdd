'use strict';

const path = require('path');
const { readFile } = require('../lib/read-file');
const { parseDependencyMatrix } = require('./matrix');
const { getStrategy, detect } = require('./strategies');

function resolveStrategy(strategyName, docContents) {
  if (strategyName === 'auto' || !strategyName) {
    return { strategy: detect(docContents), detected: true };
  }
  return { strategy: getStrategy(strategyName), detected: false };
}

function checkInterfaceConsistency(root, config) {
  const content = readFile(root, 'docs', 'ARCHITECTURE.md');

  if (content === null) {
    return {
      name: 'API_CONSISTENCY',
      status: 'skip',
      messages: ['docs/ARCHITECTURE.md not found, skipping'],
    };
  }

  const depMatrix = parseDependencyMatrix(content);

  if (depMatrix.length === 0) {
    return {
      name: 'API_CONSISTENCY',
      status: 'skip',
      messages: ['No dependency matrix found in ARCHITECTURE.md'],
    };
  }

  const contentCache = new Map();

  function readCached(root, ...segments) {
    const filePath = path.join(root, ...segments);
    if (contentCache.has(filePath)) return contentCache.get(filePath);
    const content = readFile(root, ...segments);
    contentCache.set(filePath, content);
    return content;
  }

  const docContents = [];
  for (const entry of depMatrix) {
    const c = readCached(root, 'docs/modules', entry.name, 'API.md');
    if (c !== null) docContents.push(c);
  }

  const { strategy, detected } = resolveStrategy(config.interfaceStrategy || 'auto', docContents);
  const strategyLabel = detected ? `auto-detected: ${strategy.name}` : strategy.name;

  const issues = [];

  for (const entry of depMatrix) {
    const callerModule = entry.name;

    if (readCached(root, 'docs/modules', callerModule, 'API.md') === null) {
      continue;
    }

    const deps = entry.depends
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    for (const dep of deps) {
      if (/^(-|none|null|n\/a|)$/i.test(dep)) continue;

      const depContent = readCached(root, 'docs/modules', dep, 'API.md');
      if (depContent === null) {
        issues.push(`Module '${callerModule}' depends on '${dep}' but API.md not found`);
        continue;
      }

      const depDefs = strategy.extract(depContent);

      // [TBD] items are filtered per-item below (line 88); the filter after comma split
      // handles mixed lines like "POST /auth/verify, [TBD: role check]" correctly
      const requiredInterfaces = entry.interface
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean)
        .filter((i) => !/^\[TBD/i.test(i));

      for (const required of requiredInterfaces) {
        const found = strategy.matchRequired(required, depDefs);
        if (!found) {
          issues.push(
            `Interface mismatch: '${callerModule}' requires '${required}' ` +
              `from '${dep}' but not found in ${dep}/API.md (strategy: ${strategyLabel})`,
          );
        }
      }
    }
  }

  if (issues.length === 0) {
    return {
      name: 'API_CONSISTENCY',
      status: 'pass',
      messages: [`Cross-module interface signatures consistent (strategy: ${strategyLabel})`],
    };
  }

  return {
    name: 'API_CONSISTENCY',
    status: 'fail',
    messages: issues,
  };
}

module.exports = function check(root, config) {
  return checkInterfaceConsistency(root, config);
};

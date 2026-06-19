'use strict';

const fs = require('fs');
const path = require('path');
const { parseDependencyMatrix } = require('./matrix');
const { getStrategy, detect } = require('./strategies');

function resolveStrategy(strategyName, docContents) {
  if (strategyName === 'auto' || !strategyName) {
    return { strategy: detect(docContents), detected: true };
  }
  return { strategy: getStrategy(strategyName), detected: false };
}

async function checkInterfaceConsistency(root, config) {
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return {
      name: 'API_CONSISTENCY',
      status: 'skip',
      messages: ['docs/ARCHITECTURE.md not found, skipping'],
    };
  }

  let content;
  try {
    content = fs.readFileSync(archPath, 'utf-8');
  } catch (err) {
    return {
      name: 'API_CONSISTENCY',
      status: 'fail',
      messages: [`Failed to read ARCHITECTURE.md: ${err.message}`],
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

  function readCached(filePath) {
    if (contentCache.has(filePath)) return contentCache.get(filePath);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        contentCache.set(filePath, content);
        return content;
      }
    } catch (_) {
      /* skip unreadable */
    }
    contentCache.set(filePath, null);
    return null;
  }

  const docContents = [];
  for (const entry of depMatrix) {
    const modulePath = path.join(root, 'docs/modules', entry.name, 'API.md');
    const c = readCached(modulePath);
    if (c !== null) docContents.push(c);
  }

  const { strategy, detected } = resolveStrategy(config.interfaceStrategy || 'auto', docContents);
  const strategyLabel = detected ? `auto-detected: ${strategy.name}` : strategy.name;

  const issues = [];

  for (const entry of depMatrix) {
    const callerModule = entry.name;
    const callerPath = path.join(root, 'docs/modules', callerModule, 'API.md');

    if (readCached(callerPath) === null) {
      continue;
    }

    const deps = entry.depends
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    for (const dep of deps) {
      if (/^(-|none|null|n\/a|)$/i.test(dep)) continue;

      const depPath = path.join(root, 'docs/modules', dep, 'API.md');

      const depContent = readCached(depPath);
      if (depContent === null) {
        issues.push(`Module '${callerModule}' depends on '${dep}' but API.md not found`);
        continue;
      }

      const depDefs = strategy.extract(depContent);

      const requiredInterfaces = entry.interface
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

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

module.exports = async function check(root, config) {
  return checkInterfaceConsistency(root, config);
};

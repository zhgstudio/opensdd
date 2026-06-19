'use strict';

const fs = require('fs');
const path = require('path');
const { parseDependencyMatrix } = require('./matrix');
const { getStrategy, detect } = require('./strategies');

/**
 * Extract interface groupings by heading (kept for backward compatibility).
 *
 * @param {string} content - Document content
 * @returns {Object} Map of heading → list items
 */
function extractInterfaces(content) {
  const interfaces = {};
  const lines = content.split('\n');
  let currentInterface = null;
  let inCodeBlock = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const headingMatch = trimmed.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      if (
        heading.includes('接口') ||
        heading.includes('Interface') ||
        heading.includes('API') ||
        heading.includes('Endpoint')
      ) {
        currentInterface = heading;
        interfaces[currentInterface] = [];
      }
      continue;
    }

    if (currentInterface && trimmed.startsWith('- ')) {
      interfaces[currentInterface].push(trimmed.substring(2).trim());
    }
  }

  return interfaces;
}

/**
 * Extract HTTP endpoints from document content (kept for backward compatibility).
 * Delegates to the HTTP strategy internally.
 *
 * @param {string} content - Document content
 * @returns {Array<{method: string, path: string, raw: string}>} Extracted endpoints
 */
function extractEndpoints(content) {
  const httpStrategy = getStrategy('http');
  const defs = httpStrategy.extract(content);
  return defs.map((d) => ({
    method: d.details.method,
    path: d.details.path,
    raw: d.signature,
  }));
}

/**
 * Resolve the interface strategy based on config.
 *
 * @param {string} strategyName - Config value (http|grpc|function|auto)
 * @param {string[]} docContents - Document contents for auto-detection
 * @returns {{strategy: import('./strategies').InterfaceStrategy, detected: boolean}}
 */
function resolveStrategy(strategyName, docContents) {
  if (strategyName === 'auto' || !strategyName) {
    return { strategy: detect(docContents), detected: true };
  }
  return { strategy: getStrategy(strategyName), detected: false };
}

/**
 * Check cross-module interface consistency using the configured strategy.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>} Check result
 */
async function checkInterfaceConsistency(root, config) {
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return {
      name: 'INTERFACE_CONSISTENCY',
      status: 'skip',
      messages: ['docs/ARCHITECTURE.md not found, skipping'],
    };
  }

  let content;
  try {
    content = fs.readFileSync(archPath, 'utf-8');
  } catch (err) {
    return {
      name: 'INTERFACE_CONSISTENCY',
      status: 'fail',
      messages: [`Failed to read ARCHITECTURE.md: ${err.message}`],
    };
  }

  const depMatrix = parseDependencyMatrix(content);

  if (depMatrix.length === 0) {
    return {
      name: 'INTERFACE_CONSISTENCY',
      status: 'skip',
      messages: ['No dependency matrix found in ARCHITECTURE.md'],
    };
  }

  // Collect all module document contents for auto-detection
  const docContents = [];
  for (const entry of depMatrix) {
    const modulePath = path.join(root, 'docs/modules', entry.name, 'API.md');
    try {
      if (fs.existsSync(modulePath)) {
        docContents.push(fs.readFileSync(modulePath, 'utf-8'));
      }
    } catch (_) {
      // skip unreadable files
    }
  }

  const { strategy, detected } = resolveStrategy(config.interfaceStrategy || 'auto', docContents);
  const strategyLabel = detected ? `auto-detected: ${strategy.name}` : strategy.name;

  const issues = [];

  for (const entry of depMatrix) {
    const callerModule = entry.name;
    const callerPath = path.join(root, 'docs/modules', callerModule, 'API.md');

    if (!fs.existsSync(callerPath)) {
      continue;
    }

    const deps = entry.depends
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    for (const dep of deps) {
      if (/^(-|none|null|n\/a|)$/i.test(dep)) continue;

      const depPath = path.join(root, 'docs/modules', dep, 'API.md');

      if (!fs.existsSync(depPath)) {
        issues.push(`Module '${callerModule}' depends on '${dep}' but API.md not found`);
        continue;
      }

      let depContent;
      try {
        depContent = fs.readFileSync(depPath, 'utf-8');
      } catch (err) {
        issues.push(`Failed to read ${dep}/API.md: ${err.message}`);
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
      name: 'INTERFACE_CONSISTENCY',
      status: 'pass',
      messages: [`Cross-module interface signatures consistent (strategy: ${strategyLabel})`],
    };
  }

  return {
    name: 'INTERFACE_CONSISTENCY',
    status: 'fail',
    messages: issues,
  };
}

module.exports = async function check(root, config) {
  return checkInterfaceConsistency(root, config);
};

// Retained for backward compatibility
module.exports.extractInterfaces = extractInterfaces;
module.exports.extractEndpoints = extractEndpoints;

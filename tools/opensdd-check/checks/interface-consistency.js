'use strict';

const fs = require('fs');
const path = require('path');
const { parseDependencyMatrix } = require('./matrix');

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
      if (heading.includes('接口') || heading.includes('Interface') || heading.includes('API') || heading.includes('Endpoint')) {
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

function extractEndpoints(content) {
  const endpoints = [];
  const lines = content.split('\n');

  for (const raw of lines) {
    const trimmed = raw.trim();

    const methodPathMatch = trimmed.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)/i);
    if (methodPathMatch) {
      endpoints.push({
        method: methodPathMatch[1].toUpperCase(),
        path: methodPathMatch[2],
        raw: trimmed,
      });
      continue;
    }

    const codeMatch = trimmed.match(/`(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)`/i);
    if (codeMatch) {
      endpoints.push({
        method: codeMatch[1].toUpperCase(),
        path: codeMatch[2],
        raw: trimmed,
      });
    }
  }

  return endpoints;
}

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
    return { name: 'INTERFACE_CONSISTENCY', status: 'fail', messages: [`Failed to read ARCHITECTURE.md: ${err.message}`] };
  }

  const depMatrix = parseDependencyMatrix(content);

  if (depMatrix.length === 0) {
    return {
      name: 'INTERFACE_CONSISTENCY',
      status: 'skip',
      messages: ['No dependency matrix found in ARCHITECTURE.md'],
    };
  }

  const issues = [];

  for (const entry of depMatrix) {
    const callerModule = entry.name;
    const callerPath = path.join(root, 'docs/modules', callerModule, 'INTERFACE.md');

    if (!fs.existsSync(callerPath)) {
      continue;
    }

    let callerContent;
    try {
      callerContent = fs.readFileSync(callerPath, 'utf-8');
    } catch (err) {
      issues.push(`Failed to read ${callerModule}/INTERFACE.md: ${err.message}`);
      continue;
    }

    const callerEndpoints = extractEndpoints(callerContent);

    const deps = entry.depends.split(',').map(d => d.trim()).filter(Boolean);

    for (const dep of deps) {
      if (/^(-|none|null|n\/a|)$/i.test(dep)) continue;

      const depPath = path.join(root, 'docs/modules', dep, 'INTERFACE.md');

      if (!fs.existsSync(depPath)) {
        issues.push(`Module '${callerModule}' depends on '${dep}' but INTERFACE.md not found`);
        continue;
      }

      let depContent;
      try {
        depContent = fs.readFileSync(depPath, 'utf-8');
      } catch (err) {
        issues.push(`Failed to read ${dep}/INTERFACE.md: ${err.message}`);
        continue;
      }

      const depEndpoints = extractEndpoints(depContent);

      const requiredInterfaces = entry.interface.split(',').map(i => i.trim()).filter(Boolean);

      for (const required of requiredInterfaces) {
        const methodPathMatch = required.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)/i);
        if (!methodPathMatch) continue;

        const requiredMethod = methodPathMatch[1].toUpperCase();
        const requiredPath = methodPathMatch[2];

        const found = depEndpoints.some(e =>
          e.method === requiredMethod && e.path === requiredPath
        );

        if (!found) {
          issues.push(
            `Interface mismatch: '${callerModule}' requires ${requiredMethod} ${requiredPath} ` +
            `from '${dep}' but not found in ${dep}/INTERFACE.md`
          );
        }
      }
    }
  }

  if (issues.length === 0) {
    return {
      name: 'INTERFACE_CONSISTENCY',
      status: 'pass',
      messages: ['Cross-module interface signatures consistent'],
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
'use strict';

const fs = require('fs');
const path = require('path');
const { readFile } = require('../lib/read-file');
const { escapeRegex } = require('../lib/escape');

module.exports = function checkModuleContent(root, config) {
  const REQUIRED_API_SECTIONS = config.requiredApiSections;
  const REQUIRED_DESIGN_SECTIONS = config.requiredDesignSections;
  const modulesDir = path.join(root, 'docs/modules');

  if (!fs.existsSync(modulesDir)) {
    return {
      name: 'MODULE_CONTENT',
      status: 'skip',
      messages: ['docs/modules/ not found, skipping'],
    };
  }

  let entries;
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch (err) {
    return {
      name: 'MODULE_CONTENT',
      status: 'fail',
      messages: [`Failed to read docs/modules/ directory: ${err.message}`],
    };
  }

  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (moduleDirs.length === 0) {
    return {
      name: 'MODULE_CONTENT',
      status: 'warn',
      messages: ['No module directories found in docs/modules/'],
    };
  }

  const issues = [];
  const warnings = [];
  let checkedModules = 0;

  for (const moduleDir of moduleDirs) {
    if (!new RegExp(config.moduleDirPattern).test(moduleDir)) {
      warnings.push(`Directory 'docs/modules/${moduleDir}' does not match NN-name pattern (e.g. 01-auth) — skipped`);
      continue;
    }

    checkedModules++;

    const interfaceContent = readFile(root, 'docs/modules', moduleDir, 'API.md');
    const internalsContent = readFile(root, 'docs/modules', moduleDir, 'DESIGN.md');

    if (interfaceContent === null) {
      issues.push(`Module '${moduleDir}': API.md not found`);
      continue;
    }

    if (internalsContent === null) {
      issues.push(`Module '${moduleDir}': DESIGN.md not found`);
      continue;
    }

    for (const section of REQUIRED_API_SECTIONS) {
      const headingRegex = new RegExp(`^#{1,6}\\s*${escapeRegex(section)}`, 'm');
      if (!headingRegex.test(interfaceContent)) {
        issues.push(`Module '${moduleDir}': API.md missing required section "${section}"`);
      }
    }

    for (const section of REQUIRED_DESIGN_SECTIONS) {
      const headingRegex = new RegExp(`^#{1,6}\\s*${escapeRegex(section)}`, 'm');
      if (!headingRegex.test(internalsContent)) {
        issues.push(`Module '${moduleDir}': DESIGN.md missing required section "${section}"`);
      }
    }

    const featureRegex = /^###\s*[A-Z]+-F\d{3}\b/m;
    if (!featureRegex.test(internalsContent)) {
      issues.push(`Module '${moduleDir}': DESIGN.md missing feature list entries (### MODULE-FNNN)`);
    }
  }

  if (issues.length === 0 && warnings.length > 0) {
    return {
      name: 'MODULE_CONTENT',
      status: 'warn',
      messages: warnings,
    };
  }

  if (issues.length === 0) {
    return {
      name: 'MODULE_CONTENT',
      status: 'pass',
      messages: [`${checkedModules} modules validated, all required sections present`],
    };
  }

  return {
    name: 'MODULE_CONTENT',
    status: 'fail',
    messages: issues,
  };
};

'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_INTERFACE_SECTIONS = [
  '模块概述与职责边界',
  '核心数据结构',
  '接口定义',
];

const REQUIRED_INTERNALS_SECTIONS = [
  '核心逻辑流程',
  '内部实现细节',
  '功能特性列表',
];

function checkModuleContent(root, config) {
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

  const moduleDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (moduleDirs.length === 0) {
    return {
      name: 'MODULE_CONTENT',
      status: 'warn',
      messages: ['No module directories found in docs/modules/'],
    };
  }

  const issues = [];
  let checkedModules = 0;

  for (const moduleDir of moduleDirs) {
    if (!new RegExp(config.moduleDirPattern).test(moduleDir)) {
      continue;
    }

    const modulePath = path.join(modulesDir, moduleDir);
    const interfacePath = path.join(modulePath, 'INTERFACE.md');
    const internalsPath = path.join(modulePath, 'INTERNALS.md');

    checkedModules++;

    if (!fs.existsSync(interfacePath)) {
      issues.push(`Module '${moduleDir}': INTERFACE.md not found`);
      continue;
    }

    if (!fs.existsSync(internalsPath)) {
      issues.push(`Module '${moduleDir}': INTERNALS.md not found`);
      continue;
    }

    let interfaceContent, internalsContent;
    try {
      interfaceContent = fs.readFileSync(interfacePath, 'utf-8');
      internalsContent = fs.readFileSync(internalsPath, 'utf-8');
    } catch (err) {
      issues.push(`Module '${moduleDir}': failed to read module files — ${err.message}`);
      continue;
    }

    for (const section of REQUIRED_INTERFACE_SECTIONS) {
      const headingRegex = new RegExp(`^#{1,6}\\s*${escapeRegex(section)}`, 'm');
      if (!headingRegex.test(interfaceContent)) {
        issues.push(`Module '${moduleDir}': INTERFACE.md missing required section "${section}"`);
      }
    }

    for (const section of REQUIRED_INTERNALS_SECTIONS) {
      const headingRegex = new RegExp(`^#{1,6}\\s*${escapeRegex(section)}`, 'm');
      if (!headingRegex.test(internalsContent)) {
        issues.push(`Module '${moduleDir}': INTERNALS.md missing required section "${section}"`);
      }
    }

    const featureRegex = /^###\s*\d{2}-F\d{3}\b/m;
    if (!featureRegex.test(internalsContent)) {
      issues.push(`Module '${moduleDir}': INTERNALS.md missing feature list entries (### NN-FNNN)`);
    }
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
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = async function check(root, config) {
  return checkModuleContent(root, config);
};
'use strict';

const fs = require('fs');
const path = require('path');
const { extractPublicDesign } = require('./arch-design-parser');
const { checkNamingCompliance } = require('./naming-utils');

async function checkPublicDesignCompliance(root, config) {
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'skip',
      messages: ['docs/ARCHITECTURE.md not found, skipping'],
    };
  }

  let archContent;
  try {
    archContent = fs.readFileSync(archPath, 'utf-8');
  } catch (err) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'fail',
      messages: [`Failed to read ARCHITECTURE.md: ${err.message}`],
    };
  }

  const design = extractPublicDesign(archContent);

  if (
    !design.namingConvention &&
    !design.errorFormat &&
    (!config.publicDesignRules || !config.publicDesignRules.namingConvention)
  ) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'skip',
      messages: ['No public design rules found in ARCHITECTURE.md or .sddrc.json, skipping'],
    };
  }

  const modulesDir = path.join(root, 'docs/modules');
  if (!fs.existsSync(modulesDir)) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'skip',
      messages: ['docs/modules/ not found, skipping'],
    };
  }

  let entries;
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch (err) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'fail',
      messages: [`Failed to read docs/modules/: ${err.message}`],
    };
  }

  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const issues = [];
  let checkedModules = 0;

  for (const moduleDir of moduleDirs) {
    if (!new RegExp(config.moduleDirPattern).test(moduleDir)) continue;

    const modulePath = path.join(modulesDir, moduleDir);

    for (const fileType of ['API.md', 'DESIGN.md']) {
      const filePath = path.join(modulePath, fileType);
      if (!fs.existsSync(filePath)) continue;

      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (_) {
        continue;
      }

      checkedModules++;
      issues.push(...checkNamingCompliance(moduleDir, fileType, content, design, config));
    }
  }

  if (checkedModules === 0) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'warn',
      messages: ['No module files found to check'],
    };
  }

  if (issues.length === 0) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'pass',
      messages: [
        `${checkedModules} module files checked, all compliant with public design` +
          (design.namingConvention ? ` (${design.namingConvention})` : ''),
      ],
    };
  }

  return {
    name: 'PUBLIC_DESIGN_COMPLIANCE',
    status: 'fail',
    messages: issues,
  };
}

module.exports = async function check(root, config) {
  return checkPublicDesignCompliance(root, config);
};

'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function check(root) {
  const specPath = path.join(root, 'docs', 'SPEC.md');

  if (!fs.existsSync(specPath)) {
    return { name: 'TRACEABILITY', status: 'skip', messages: ['docs/SPEC.md not found, skipping'] };
  }

  let specContent;
  try {
    specContent = fs.readFileSync(specPath, 'utf-8');
  } catch (err) {
    return { name: 'TRACEABILITY', status: 'fail', messages: [`Failed to read SPEC.md: ${err.message}`] };
  }

  const reqIds = new Set();
  const reqRegex = /\bREQ-(\d+)\b/g;
  let m;
  while ((m = reqRegex.exec(specContent)) !== null) {
    reqIds.add(`REQ-${m[1]}`);
  }

  const featureIds = new Set();
  const modulesDir = path.join(root, 'docs', 'modules');

  if (fs.existsSync(modulesDir)) {
    let entries;
    try {
      entries = fs.readdirSync(modulesDir, { withFileTypes: true });
    } catch {
      entries = [];
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const designPath = path.join(modulesDir, entry.name, 'DESIGN.md');
      if (!fs.existsSync(designPath)) continue;

      let designContent;
      try {
        designContent = fs.readFileSync(designPath, 'utf-8');
      } catch {
        continue;
      }

      const feRegex = /\b(\d{2}-F\d{3})\b/g;
      while ((m = feRegex.exec(designContent)) !== null) {
        featureIds.add(m[1]);
      }
    }
  }

  const warnings = [];

  if (reqIds.size > 0 && featureIds.size === 0) {
    warnings.push(
      `${reqIds.size} requirement(s) defined in SPEC.md but no features found in any DESIGN.md ` +
        `— requirements may lack corresponding features`,
    );
  }

  if (featureIds.size > 0 && reqIds.size === 0) {
    warnings.push(
      `${featureIds.size} feature(s) found in DESIGN.md files but no requirements defined in SPEC.md ` +
        `— features may lack corresponding requirements`,
    );
  }

  if (warnings.length === 0) {
    return {
      name: 'TRACEABILITY',
      status: 'pass',
      messages: [`${reqIds.size} requirement(s), ${featureIds.size} feature(s)`],
    };
  }

  return {
    name: 'TRACEABILITY',
    status: 'warn',
    messages: warnings,
  };
};

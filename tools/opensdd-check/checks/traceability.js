'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Extract all REQ-NNN identifiers from module design files.
 * Each module's DESIGN.md may reference requirements via text mentions.
 *
 * @param {string} modulesDir - Absolute path to docs/modules/
 * @returns {Map<string, string[]>} reqToModules - Map of REQ-NNN → module names that reference it
 */
function collectReqReferences(modulesDir) {
  const reqToModules = new Map();

  if (!fs.existsSync(modulesDir)) return reqToModules;

  let entries;
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch {
    return reqToModules;
  }

  const reqRefRegex = /\bREQ-(\d+)\b/g;

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

    let m;
    while ((m = reqRefRegex.exec(designContent)) !== null) {
      const reqId = `REQ-${m[1]}`;
      if (!reqToModules.has(reqId)) {
        reqToModules.set(reqId, []);
      }
      reqToModules.get(reqId).push(entry.name);
    }
  }

  return reqToModules;
}

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

  // Collect all REQ-NNN from SPEC.md
  const reqIds = new Set();
  const reqRegex = /\bREQ-(\d+)\b/g;
  let m;
  while ((m = reqRegex.exec(specContent)) !== null) {
    reqIds.add(`REQ-${m[1]}`);
  }

  // Collect all NN-FNNN from DESIGN.md files
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

  // Collect REQ-NNN references from DESIGN.md files
  const reqToModules = collectReqReferences(modulesDir);

  const warnings = [];

  // Element-level check: each REQ should be referenced in at least one DESIGN.md
  const uncoveredReqs = [];
  for (const reqId of reqIds) {
    if (!reqToModules.has(reqId)) {
      uncoveredReqs.push(reqId);
    }
  }

  if (uncoveredReqs.length > 0) {
    const sample =
      uncoveredReqs.length <= 5
        ? uncoveredReqs.join(', ')
        : uncoveredReqs.slice(0, 5).join(', ') + `, and ${uncoveredReqs.length - 5} more`;
    warnings.push(
      `${uncoveredReqs.length} requirement(s) not referenced in any DESIGN.md (${sample}) ` +
        '— requirements should be mentioned in relevant module design docs for traceability',
    );
  }

  // Bidirectional existence check: REQs exist but no features at all
  if (reqIds.size > 0 && featureIds.size === 0) {
    warnings.push(
      `${reqIds.size} requirement(s) defined in SPEC.md but no features found in any DESIGN.md ` +
        '— requirements may lack corresponding features',
    );
  }

  // Bidirectional existence check: features exist but no REQs at all
  if (featureIds.size > 0 && reqIds.size === 0) {
    warnings.push(
      `${featureIds.size} feature(s) found in DESIGN.md files but no requirements defined in SPEC.md ` +
        '— features may lack corresponding requirements',
    );
  }

  if (warnings.length === 0) {
    const coveredCount = Array.from(reqIds).filter((id) => reqToModules.has(id)).length;
    return {
      name: 'TRACEABILITY',
      status: 'pass',
      messages: [
        `${reqIds.size} requirement(s), ${featureIds.size} feature(s), ${coveredCount} req(s) cross-referenced in DESIGN.md`,
      ],
    };
  }

  return {
    name: 'TRACEABILITY',
    status: 'warn',
    messages: warnings,
  };
};

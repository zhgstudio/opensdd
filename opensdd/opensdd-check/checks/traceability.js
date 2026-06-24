'use strict';

/**
 * TRACEABILITY — Requirement-to-feature traceability check.
 *
 * WARN-only by intentional design. Full structural traceability (every REQ
 * mapped to one or more NN-FNNN) requires human judgement — not all requirements
 * are implementable as isolated features, and not all features map to numbered
 * requirements. This check performs a heuristic regex scan as a lightweight
 * aid, not a hard gate. Downstream projects that want stricter enforcement
 * should layer their own tooling on top.
 */

const fs = require('fs');
const path = require('path');
const { readFile } = require('../lib/read-file');

/**
 * Extract all REQ-DOMAIN-NNN identifiers from module design files.
 * Each module's DESIGN.md may reference requirements via text mentions.
 *
 * @param {string} modulesDir - Absolute path to docs/modules/
 * @returns {Map<string, string[]>} reqToModules - Map of REQ-DOMAIN-NNN → module names that reference it
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

  const reqRefRegex = /\bREQ-([A-Z]+)-(\d+)\b/g;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const designContent = readFile(modulesDir, entry.name, 'DESIGN.md');
    if (designContent === null) continue;

    let m;
    while ((m = reqRefRegex.exec(designContent)) !== null) {
      const reqId = `REQ-${m[1]}-${m[2]}`;
      if (!reqToModules.has(reqId)) {
        reqToModules.set(reqId, []);
      }
      reqToModules.get(reqId).push(entry.name);
    }
  }

  return reqToModules;
}

module.exports = function check(root) {
  const specContent = readFile(root, 'docs', 'SPEC.md');

  if (specContent === null) {
    return { name: 'TRACEABILITY', status: 'skip', messages: ['docs/SPEC.md not found, skipping'] };
  }

  // Collect all REQ-DOMAIN-NNN from SPEC.md
  const reqIds = new Set();
  const reqRegex = /\bREQ-([A-Z]+)-(\d+)\b/g;
  let m;
  while ((m = reqRegex.exec(specContent)) !== null) {
    reqIds.add(`REQ-${m[1]}-${m[2]}`);
  }

  // Collect all MODULE-FNNN from DESIGN.md files
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
      const designContent = readFile(modulesDir, entry.name, 'DESIGN.md');
      if (designContent === null) continue;

      const feRegex = /\b([A-Z]+-F\d{3})\b/g;
      while ((m = feRegex.exec(designContent)) !== null) {
        featureIds.add(m[1]);
      }
    }
  }

  // Collect REQ-DOMAIN-NNN references from DESIGN.md files
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

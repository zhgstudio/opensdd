'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Parse SKILL.md frontmatter and extract version.
 * Supports both dot-notation (metadata.version: X.Y.Z) and
 * nested YAML (metadata:\n  version: X.Y.Z) formats.
 *
 * @param {string} skillPath - Absolute path to SKILL.md
 * @returns {string|null} Version string or null
 */
function readSkillVersion(skillPath) {
  try {
    if (!fs.existsSync(skillPath)) return null;
    const content = fs.readFileSync(skillPath, 'utf-8');

    const openMatch = content.match(/^---\r?\n/);
    if (!openMatch) return null;

    const openLen = openMatch[0].length;
    const afterOpen = content.slice(openLen);
    const closeMatch = afterOpen.match(/\r?\n---\r?\n/);
    if (!closeMatch) return null;

    const yamlStr = content.substring(openLen, openLen + closeMatch.index);
    const data = yaml.load(yamlStr);
    if (typeof data !== 'object' || data === null) return null;

    // Try dot-notation: data['metadata.version']
    if (typeof data['metadata.version'] === 'string') return data['metadata.version'];

    // Try nested: data.metadata.version
    if (data.metadata && typeof data.metadata.version === 'string') return data.metadata.version;

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract version value from YAML frontmatter content.
 * Handles both dot-notation (metadata.version: X.Y.Z) and
 * nested YAML (metadata:\n  version: X.Y.Z) formats.
 *
 * @param {string} frontmatter - Raw frontmatter string (between --- markers)
 * @returns {string|null} Version string or null if not found
 */
function extractFrontmatterVersion(frontmatter) {
  try {
    const data = require('js-yaml').load(frontmatter);
    if (typeof data !== 'object' || data === null) return null;

    if (typeof data['metadata.version'] === 'string') return data['metadata.version'];
    if (data.metadata && typeof data.metadata.version === 'string') return data.metadata.version;

    return null;
  } catch {
    return null;
  }
}

/**
 * Read a JSON file and return the version field, or null if not found.
 *
 * @param {string} filePath - Absolute path to package.json
 * @returns {string|null} Version string or null
 */
function readPackageVersion(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(raw);
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

/**
 * Check that SKILL.md version matches all package.json version fields.
 *
 * @param {string} root - Absolute path to the project root
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function check(root) {
  const skillPath = path.join(root, 'opensdd', 'SKILL.md');
  const rootPkgPath = path.join(root, 'package.json');
  const checkPkgPath = path.join(root, 'tools', 'opensdd-check', 'package.json');

  const skillVersion = readSkillVersion(skillPath);

  if (skillVersion === null) {
    return {
      name: 'VERSION_CONSISTENCY',
      status: 'skip',
      messages: ['opensdd/SKILL.md not found or missing version frontmatter, skipping'],
    };
  }

  const messages = [];
  let hasMismatch = false;
  let hasMissing = false;

  const entries = [
    { label: 'SKILL.md', path: skillPath, version: skillVersion, source: 'metadata.version' },
    { label: '根 package.json', path: rootPkgPath, version: null, source: 'version' },
    { label: 'tools/opensdd-check/package.json', path: checkPkgPath, version: null, source: 'version' },
  ];

  for (const entry of entries) {
    if (entry.label === 'SKILL.md') {
      // Already have the version; just log for reference
      messages.push(`${entry.label}: version = ${entry.version} (${entry.source})`);
      continue;
    }

    const ver = readPackageVersion(entry.path);
    if (ver === null) {
      messages.push(`${entry.label}: missing or unreadable — version not checked`);
      hasMissing = true;
      continue;
    }

    messages.push(`${entry.label}: version = ${ver} (${entry.source})`);

    if (ver !== skillVersion) {
      messages.push(`  → MISMATCH: SKILL.md 为 ${skillVersion}, ${entry.label} 为 ${ver}`);
      hasMismatch = true;
    }
  }

  if (hasMismatch) {
    return {
      name: 'VERSION_CONSISTENCY',
      status: 'fail',
      messages,
    };
  }

  if (hasMissing) {
    return {
      name: 'VERSION_CONSISTENCY',
      status: 'warn',
      messages: ['Versions consistent, but some package.json files missing', ...messages.slice(1)],
    };
  }

  return {
    name: 'VERSION_CONSISTENCY',
    status: 'pass',
    messages: [`All ${entries.length} sources agree on version ${skillVersion}`],
  };
};

module.exports.extractFrontmatterVersion = extractFrontmatterVersion;

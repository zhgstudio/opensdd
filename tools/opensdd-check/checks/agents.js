'use strict';

const fs = require('fs');
const path = require('path');
const { splitLines } = require('../lib/line-split');

/**
 * Check that AGENTS.md contains all required sections (by heading-level matching).
 * Only checks lines starting with `## ` — body text matches are ignored.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>} Check result
 */
module.exports = function check(root, config) {
  const agentsPath = path.join(root, 'AGENTS.md');

  if (!fs.existsSync(agentsPath)) {
    return { name: 'AGENTS_SECTIONS', status: 'skip', messages: ['AGENTS.md not found, skipping'] };
  }

  let content;
  try {
    content = fs.readFileSync(agentsPath, 'utf-8');
  } catch (err) {
    return { name: 'AGENTS_SECTIONS', status: 'fail', messages: [`Failed to read AGENTS.md: ${err.message}`] };
  }

  const headings = splitLines(content)
    .filter((line) => line.trimStart().startsWith('## '))
    .map((line) => line.trim().toLowerCase());

  const missing = [];

  for (const section of config.requiredAgentSections) {
    const found = section.keywords.some((kw) => headings.some((h) => h.includes(kw.toLowerCase())));
    if (!found) {
      missing.push(section.keywords[0]);
    }
  }

  if (missing.length === 0) {
    return {
      name: 'AGENTS_SECTIONS',
      status: 'pass',
      messages: [`All ${config.requiredAgentSections.length} required sections present`],
    };
  }

  return {
    name: 'AGENTS_SECTIONS',
    status: 'fail',
    messages: [`Missing sections: ${missing.join(', ')}`],
  };
};

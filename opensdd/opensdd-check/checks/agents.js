'use strict';

const { readFile } = require('../lib/read-file');
const { splitLines } = require('../lib/line-split');

/**
 * Check that AGENTS.md contains all required sections (by heading-level matching).
 * Only checks lines starting with `## ` — body text matches are ignored.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function check(root, config) {
  const content = readFile(root, 'AGENTS.md');

  if (content === null) {
    return { name: 'AGENTS_SECTIONS', status: 'skip', messages: ['AGENTS.md not found, skipping'] };
  }

  const headings = splitLines(content)
    .filter((line) => line.trimStart().startsWith('## '))
    .map((line) => line.trim().replace(/^##\s+/, '').toLowerCase());

  const missing = [];

  for (const section of config.requiredAgentSections) {
    const found = headings.some((h) => h === section.heading.toLowerCase());
    if (!found) {
      missing.push(section.heading);
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

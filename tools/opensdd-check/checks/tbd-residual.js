'use strict';

const { readFile } = require('../lib/read-file');
const { splitLines } = require('../lib/line-split');

/**
 * Check that no [TBD] markers remain in ARCHITECTURE.md.
 * The methodology requires all [TBD] markers to be resolved before finalization.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} _config - SDD configuration
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function check(root, _config) {
  const content = readFile(root, 'docs', 'ARCHITECTURE.md');

  if (content === null) {
    return { name: 'TBD_RESIDUAL', status: 'skip', messages: ['docs/ARCHITECTURE.md not found, skipping'] };
  }

  const tbdPattern = /\[TBD[^\]]*\]/i;
  const matches = [];
  const lines = splitLines(content);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Skip comment-like lines and code blocks that document the [TBD] concept itself
    if (trimmed.startsWith('<!--') || trimmed.startsWith('```')) continue;
    if (tbdPattern.test(trimmed)) {
      matches.push(`line ${i + 1}: ${trimmed}`);
    }
  }

  if (matches.length === 0) {
    return {
      name: 'TBD_RESIDUAL',
      status: 'pass',
      messages: ['No residual [TBD] markers found in ARCHITECTURE.md'],
    };
  }

  return {
    name: 'TBD_RESIDUAL',
    status: 'fail',
    messages: [
      `Found ${matches.length} residual [TBD] marker(s) in ARCHITECTURE.md — all must be resolved before finalization`,
      ...matches,
    ],
  };
};

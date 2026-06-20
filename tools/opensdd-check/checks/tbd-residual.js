'use strict';

const fs = require('fs');
const path = require('path');
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
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return { name: 'TBD_RESIDUAL', status: 'skip', messages: ['docs/ARCHITECTURE.md not found, skipping'] };
  }

  let content;
  try {
    content = fs.readFileSync(archPath, 'utf-8');
  } catch (err) {
    return { name: 'TBD_RESIDUAL', status: 'fail', messages: [`Failed to read ARCHITECTURE.md: ${err.message}`] };
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

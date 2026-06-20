'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Check that no tmp/ directories exist in the project.
 * tmp/ directories indicate temporary process documents not meant for version control.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} _config - SDD configuration (unused)
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function checkTmpDirs(root, _config) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const tmpDirs = entries
    .filter(e => e.isDirectory() && e.name === 'tmp')
    .map(e => path.join(root, e.name));

  if (tmpDirs.length === 0) {
    return {
      name: 'NO_TMP',
      status: 'pass',
      messages: ['No tmp/ directories found'],
    };
  }

  return {
    name: 'NO_TMP',
    status: 'fail',
    messages: tmpDirs.map(d => `Temporary directory found: ${d}`),
  };
};

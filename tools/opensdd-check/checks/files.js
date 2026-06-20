'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Check that all required files exist in the project.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function check(root, config) {
  const missing = [];

  for (const rel of config.requiredFiles) {
    const fp = path.join(root, rel);
    if (!fs.existsSync(fp)) missing.push(rel);
  }

  if (missing.length === 0) {
    return {
      name: 'FILE_EXISTS',
      status: 'pass',
      messages: [`All ${config.requiredFiles.length} required files present`],
    };
  }

  return {
    name: 'FILE_EXISTS',
    status: 'fail',
    messages: [`Missing: ${missing.join(', ')}`],
  };
};

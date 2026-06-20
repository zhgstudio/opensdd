'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Recursively find all tmp/ directories under a given root path.
 *
 * @param {string} dirPath - Directory to scan
 * @returns {string[]} Absolute paths of found tmp/ directories
 */
function findTmpDirs(dirPath) {
  const found = [];

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name === 'tmp') {
      found.push(fullPath);
    } else {
      found.push(...findTmpDirs(fullPath));
    }
  }

  return found;
}

/**
 * Check that no tmp/ directories exist in the project.
 * Recursively scans all subdirectories for any tmp/ directory.
 * tmp/ directories indicate temporary process documents not meant for version control.
 *
 * @param {string} root - Absolute path to the project root
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function checkTmpDirs(root) {
  const tmpDirs = findTmpDirs(root);

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
    messages: tmpDirs.map((d) => `Temporary directory found: ${d}`),
  };
};

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
    // Skip symlinks to prevent infinite recursion from symlink loops
    if (entry.isSymbolicLink()) continue;
    // Skip common directories that may contain third-party tmp/ (false positives)
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
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
 * Check that no tmp/ directories exist under docs/.
 * tmp/ directories indicate temporary process documents not meant for version control.
 *
 * @param {string} root - Absolute path to the project root
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function checkTmpDirs(root) {
  const docsDir = path.join(root, 'docs');

  if (!fs.existsSync(docsDir)) {
    return {
      name: 'NO_TMP',
      status: 'pass',
      messages: ['docs/ directory not found, skipping'],
    };
  }

  const tmpDirs = findTmpDirs(docsDir);

  if (tmpDirs.length === 0) {
    return {
      name: 'NO_TMP',
      status: 'pass',
      messages: ['No tmp/ directories found under docs/'],
    };
  }

  return {
    name: 'NO_TMP',
    status: 'fail',
    messages: tmpDirs.map((d) => `Temporary directory found: ${d}`),
  };
};

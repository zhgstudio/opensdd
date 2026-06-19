'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Recursively walk a directory tree and yield file paths matching garbage patterns.
 *
 * @param {string} dir - Directory to walk
 * @param {RegExp} garbageRe - Compiled regex for garbage file detection
 * @param {Set<string>} skipDirs - Set of directory names to skip
 * @returns {Generator<string, void, void>} Generator of matching file paths
 */
function* walkFiles(dir, garbageRe, skipDirs) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      yield* walkFiles(path.join(dir, entry.name), garbageRe, skipDirs);
    } else if (entry.isFile() && garbageRe.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

/**
 * Check that no garbage/versioned files exist in the project tree.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>} Check result
 */
module.exports = async function check(root, config) {
  const garbageRe = new RegExp(`(${config.garbagePatterns.join('|')})`, 'i');
  const skipDirs = new Set(config.skipDirs || ['node_modules', '.git', '.github']);

  const hits = [];
  for (const fp of walkFiles(root, garbageRe, skipDirs)) {
    hits.push(fp);
  }

  if (hits.length === 0) {
    return { name: 'NO_GARBAGE', status: 'pass', messages: ['No garbage versioned files found'] };
  }

  return {
    name: 'NO_GARBAGE',
    status: 'warn',
    messages: hits.map((f) => `Found garbage file: ${f}`),
  };
};

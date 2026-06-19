'use strict';

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', '.github']);

/**
 * Recursively walk a directory tree and yield file paths matching garbage patterns.
 *
 * @param {string} dir - Directory to walk
 * @param {RegExp} garbageRe - Compiled regex for garbage file detection
 * @returns {Generator<string, void, void>} Generator of matching file paths
 */
function* walkFiles(dir, garbageRe) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkFiles(path.join(dir, entry.name), garbageRe);
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
  const garbageRe = new RegExp(`(${config.garbagePatterns.join('|')})\\.md$`, 'i');

  const hits = [];
  for (const fp of walkFiles(root, garbageRe)) {
    hits.push(fp);
  }

  if (hits.length === 0) {
    return { name: 'NO_GARBAGE', status: 'pass', messages: ['No garbage versioned files found'] };
  }

  return {
    name: 'NO_GARBAGE',
    status: 'warn',
    messages: hits.map(f => `Found garbage file: ${f}`),
  };
};

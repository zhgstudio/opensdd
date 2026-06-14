const fs = require('fs');
const path = require('path');

// Garbage patterns: files that should never exist in a clean SDD project
const GARBAGE_RE = /(_v\d+|_final|_tmp\w*|_old|_backup|\.bak)\.md$/i;
const SKIP_DIRS = new Set(['node_modules', '.git', '.github']);

function* walkFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkFiles(path.join(dir, entry.name));
    } else if (entry.isFile() && GARBAGE_RE.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

module.exports = async function check(root) {
  const hits = [];
  for (const fp of walkFiles(root)) {
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

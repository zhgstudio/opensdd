'use strict';

const fs = require('fs');
const path = require('path');

function readFile(root, ...segments) {
  const fp = path.join(root, ...segments);
  try {
    if (fs.existsSync(fp)) return fs.readFileSync(fp, 'utf-8');
  } catch (err) {
    console.warn(`Warning: Failed to read ${fp}: ${err.message}`);
  }
  return null;
}

module.exports = { readFile };

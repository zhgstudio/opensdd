'use strict';

const fs = require('fs');
const path = require('path');

function readFile(root, ...segments) {
  const fp = path.join(root, ...segments);
  try {
    if (fs.existsSync(fp)) {
      let content = fs.readFileSync(fp, 'utf-8');
      // Strip UTF-8 BOM (\uFEFF) if present, so frontmatter detection works
      if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
      return content;
    }
  } catch (err) {
    console.warn(`Warning: Failed to read ${fp}: ${err.message}`);
  }
  return null;
}

module.exports = { readFile };

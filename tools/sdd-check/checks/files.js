const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  { rel: 'docs/SPEC.md', label: 'docs/SPEC.md' },
  { rel: 'docs/ARCHITECTURE.md', label: 'docs/ARCHITECTURE.md' },
  { rel: 'docs/PLAN.md', label: 'docs/PLAN.md' },
  { rel: 'AGENTS.md', label: 'AGENTS.md' },
];

module.exports = async function check(root) {
  const missing = [];

  for (const f of REQUIRED_FILES) {
    const fp = path.join(root, f.rel);
    if (!fs.existsSync(fp)) missing.push(f.label);
  }

  if (missing.length === 0) {
    return { name: 'FILE_EXISTS', status: 'pass', messages: ['All 4 required files present'] };
  }

  return {
    name: 'FILE_EXISTS',
    status: 'fail',
    messages: [`Missing: ${missing.join(', ')}`],
  };
};

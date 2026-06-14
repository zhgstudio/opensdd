const fs = require('fs');
const path = require('path');

// Expected: "- [ ] T001: Description (depends: T001) [src/file.ts]"
// status: " " (todo), "x" (done), "~" (redo)
const TASK_RE = /^-\s+\[([ x~])\]\s+(T\d+)\s*:\s*(.+)$/;

module.exports = async function check(root) {
  const planPath = path.join(root, 'docs/PLAN.md');

  if (!fs.existsSync(planPath)) {
    return { name: 'PLAN_FORMAT', status: 'skip', messages: ['docs/PLAN.md not found, skipping'] };
  }

  const lines = fs.readFileSync(planPath, 'utf-8').split('\n');
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // only check list items that look like tasks
    if (!trimmed.startsWith('- [')) continue;

    const match = trimmed.match(TASK_RE);
    if (!match) {
      issues.push(`line ${i + 1}: malformed — does not match "- [ ] T###: description" pattern`);
      continue;
    }

    const status = match[1];
    const taskId = match[2];

    if (status !== ' ' && status !== 'x' && status !== '~') {
      issues.push(`line ${i + 1}: invalid status "[${status}]", expected " ", "x", or "~"`);
    }

    if (!/^T\d+$/.test(taskId)) {
      issues.push(`line ${i + 1}: invalid task ID "${taskId}", expected T###`);
    }
  }

  if (issues.length === 0) {
    return { name: 'PLAN_FORMAT', status: 'pass', messages: ['All tasks follow valid format'] };
  }

  return { name: 'PLAN_FORMAT', status: 'fail', messages: issues };
};

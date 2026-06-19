'use strict';

const fs = require('fs');
const path = require('path');

// Optional reference at end: [NN-name/INTERNALS.md#NN-FNNN] where NNN is 3 digits per SKILL.md
const REF_RE = /\[([a-zA-Z0-9]+-[a-zA-Z0-9_-]+\/INTERNALS\.md#\d{2}-F\d{3})\]/;

/**
 * Extract module name from the ref path (e.g., "01-auth" from "01-auth/INTERNALS.md#01-F001").
 *
 * @param {string} ref - Reference string from task line
 * @returns {string|null} Module name or null
 */
function extractModuleFromRef(ref) {
  const parts = ref.split('/');
  if (parts.length >= 1) return parts[0];
  return null;
}

/**
 * Check that PLAN.md has valid task format and references.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>} Check result
 */
module.exports = async function check(root, config) {
  const TASK_RE = new RegExp(config.taskRegex);
  const MODULE_DIR_RE = new RegExp(config.moduleDirPattern);
  const planPath = path.join(root, 'docs/PLAN.md');

  if (!fs.existsSync(planPath)) {
    return { name: 'PLAN_FORMAT', status: 'skip', messages: ['docs/PLAN.md not found, skipping'] };
  }

  let content;
  try {
    content = fs.readFileSync(planPath, 'utf-8');
  } catch (err) {
    return { name: 'PLAN_FORMAT', status: 'fail', messages: [`Failed to read ${planPath}: ${err.message}`] };
  }

  const lines = content.split('\n');
  const issues = [];
  let taskCount = 0;
  let refCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed.startsWith('- [')) continue;

    const match = trimmed.match(TASK_RE);
    if (!match) {
      issues.push(`line ${i + 1}: malformed — does not match "- [ ] T-{NNN}: description" pattern`);
      continue;
    }

    taskCount++;
    const status = match[1];
    const taskId = match[2];
    const descriptionPart = match[3];

    if (status !== ' ' && status !== 'x') {
      issues.push(`line ${i + 1}: invalid status "[${status}]", expected " " or "x"`);
    }

    if (!/^T-\d+$/.test(taskId)) {
      issues.push(`line ${i + 1}: invalid task ID "${taskId}", expected T-{NNN}`);
    }

    // Check for INTERNALS.md reference
    const refMatch = descriptionPart.match(REF_RE);
    if (refMatch) {
      refCount++;
      const ref = refMatch[1];
      const moduleName = extractModuleFromRef(ref);

      // Verify module directory exists
      if (moduleName && MODULE_DIR_RE.test(moduleName)) {
        const moduleDirPath = path.join(root, 'docs/modules', moduleName);
        const internalsPath = path.join(moduleDirPath, 'INTERNALS.md');
        if (!fs.existsSync(internalsPath)) {
          issues.push(`line ${i + 1}: referenced module dir "${moduleName}" exists but INTERNALS.md not found`);
        }
      }
    }
  }

  if (issues.length === 0) {
    const detail = `${taskCount} tasks, ${refCount} with INTERNALS.md references`;
    return { name: 'PLAN_FORMAT', status: 'pass', messages: [detail] };
  }

  return { name: 'PLAN_FORMAT', status: 'fail', messages: issues };
};

'use strict';

const fs = require('fs');
const path = require('path');
const { readFile } = require('../lib/read-file');
const { splitLines } = require('../lib/line-split');

// Optional reference at end: [module-name/DESIGN.md#MODULE-FNNN] where NNN is 3 digits per SKILL.md
const REF_RE = /\[([a-zA-Z0-9]+-[a-zA-Z0-9_-]+\/DESIGN\.md#[A-Z]+(?:-[A-Z]+)*-F\d{3})\]/;

// Dependency syntax: depends: T-MODULE-NNN or depends: T-MODULE-NNN, T-MODULE-NNN (comma-separated)
// Supports multi-word MODULE names with hyphens (e.g. T-TASK-CORE-001)
const DEPENDS_RE = /\bdepends:\s*(T-[A-Z]+(?:-[A-Z]+)*-\d+(?:\s*,\s*T-[A-Z]+(?:-[A-Z]+)*-\d+)*)$/i;

/**
 * Extract module name from the ref path (e.g., "auth" from "auth/DESIGN.md#AUTH-F001").
 *
 * @param {string} ref - Reference string from task line
 * @returns {string|null} Module name or null
 */
function extractModuleFromRef(ref) {
  return ref.split('/')[0];
}

/**
 * Check that PLAN.md has valid task format and references.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function check(root, config) {
  const TASK_RE = new RegExp(config.taskRegex);
  const MODULE_DIR_RE = new RegExp(config.moduleDirPattern);

  const content = readFile(root, 'docs/PLAN.md');

  if (content === null) {
    return { name: 'PLAN_FORMAT', status: 'skip', messages: ['docs/PLAN.md not found, skipping'] };
  }

  const lines = splitLines(content);
  const issues = [];
  let taskCount = 0;
  let refCount = 0;
  const taskIds = new Set();
  /** @type {Array<{line: number, dep: string}>} */
  const depRefs = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed.startsWith('- [')) continue;

    const match = trimmed.match(TASK_RE);
    if (!match) {
      issues.push(`line ${i + 1}: malformed — does not match "- [ ] T-{MODULE}-{NNN}: description" pattern`);
      continue;
    }

    taskCount++;
    const taskId = match[2];
    const descriptionPart = match[3];

    if (taskId === undefined) {
      issues.push(`line ${i + 1}: malformed — could not extract task ID from match`);
      continue;
    }

    if (taskIds.has(taskId)) {
      issues.push(`line ${i + 1}: duplicate task ID "${taskId}"`);
    }
    taskIds.add(taskId);

    if (!/^T-[A-Z]+(?:-[A-Z]+)*-\d+$/.test(taskId)) {
      issues.push(`line ${i + 1}: invalid task ID "${taskId}", expected T-{MODULE}-{NNN}`);
    }

    if (descriptionPart === undefined) continue;

    // Check for DESIGN.md reference
    const refMatch = descriptionPart.match(REF_RE);
    if (refMatch) {
      refCount++;
      const ref = refMatch[1];
      const moduleName = extractModuleFromRef(ref);

      // Verify module directory exists
      if (moduleName && MODULE_DIR_RE.test(moduleName)) {
        const moduleDirPath = path.join(root, 'docs/modules', moduleName);
        const internalsPath = path.join(moduleDirPath, 'DESIGN.md');
        if (!fs.existsSync(internalsPath)) {
          issues.push(`line ${i + 1}: referenced module dir "${moduleName}" exists but DESIGN.md not found`);
        }
      }
    }

    // Validate dependency syntax (depends: T-MODULE-NNN or depends: T-MODULE-NNN, T-MODULE-NNN)
    const dependsMatch = descriptionPart.match(DEPENDS_RE);
    if (dependsMatch) {
      const deps = dependsMatch[1].split(',').map((d) => d.trim());
      for (const dep of deps) {
        if (!/^T-[A-Z]+(?:-[A-Z]+)*-\d+$/.test(dep)) {
          issues.push(`line ${i + 1}: invalid dependency "${dep}", expected T-{MODULE}-{NNN}`);
        } else {
          depRefs.push({ line: i + 1, dep });
        }
      }
    }
  }

  // Validate that all dependency references point to existing task IDs
  for (const { line, dep } of depRefs) {
    if (!taskIds.has(dep)) {
      issues.push(`line ${line}: dependency "${dep}" references non-existent task ID`);
    }
  }

  if (issues.length === 0) {
    const detail = `${taskCount} tasks, ${refCount} with DESIGN.md references`;
    return { name: 'PLAN_FORMAT', status: 'pass', messages: [detail] };
  }

  return { name: 'PLAN_FORMAT', status: 'fail', messages: issues };
};

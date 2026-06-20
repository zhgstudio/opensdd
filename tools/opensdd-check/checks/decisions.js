'use strict';

const fs = require('fs');
const path = require('path');
const { escapeRegex } = require('../lib/escape');

/**
 * Check that DECISIONS.md has valid YAML frontmatter and required sections.
 *
 * @param {string} root - Absolute path to the project root
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function checkDecisions(root) {
  const decisionsPath = path.join(root, 'docs', 'DECISIONS.md');

  if (!fs.existsSync(decisionsPath)) {
    return {
      name: 'DECISIONS_FORMAT',
      status: 'skip',
      messages: ['docs/DECISIONS.md not found, skipping'],
    };
  }

  let content;
  try {
    content = fs.readFileSync(decisionsPath, 'utf-8');
  } catch (err) {
    return {
      name: 'DECISIONS_FORMAT',
      status: 'fail',
      messages: [`Failed to read docs/DECISIONS.md: ${err.message}`],
    };
  }

  const issues = [];

  // Check YAML frontmatter validity
  const openMatch = content.match(/^---\r?\n/);
  if (!openMatch) {
    issues.push('Missing YAML frontmatter (must start with ---)');
  } else {
    const openLen = openMatch[0].length;
    const afterOpen = content.slice(openLen);
    const closeMatch = afterOpen.match(/\r?\n---\r?\n/);
    if (!closeMatch) {
      issues.push('YAML frontmatter has no closing ---');
    }
  }

  // Check required sections: 理由 (reason) and 取消条件 (cancellation condition)
  const sections = ['理由', '取消条件'];
  for (const section of sections) {
    const headingRegex = new RegExp(`^#{1,6}\\s*${escapeRegex(section)}`, 'm');
    if (!headingRegex.test(content)) {
      issues.push(`Missing required section "${section}"`);
    }
  }

  if (issues.length === 0) {
    return {
      name: 'DECISIONS_FORMAT',
      status: 'pass',
      messages: ['docs/DECISIONS.md has valid frontmatter and required sections'],
    };
  }

  return {
    name: 'DECISIONS_FORMAT',
    status: 'warn',
    messages: issues,
  };
};

'use strict';

const fs = require('fs');
const path = require('path');
const { readFile } = require('../lib/read-file');
const { parseFrontmatter, getField } = require('../lib/frontmatter');

/**
 * Check that skill files have valid YAML frontmatter.
 *
 * @param {string} root - Absolute path to the project root
 * @returns {{name: string, status: string, messages: string[]}} Check result
 */
module.exports = function check(root) {
  const skillsDir = path.join(root, 'opensdd');
  const issues = [];

  if (!fs.existsSync(skillsDir)) {
    // Detect if running on opensdd project itself (self-check mode)
    const ownPkgPath = path.join(root, 'opensdd', 'opensdd-check', 'package.json');
    const isSelfCheck = fs.existsSync(ownPkgPath);
    if (isSelfCheck) {
      return {
        name: 'FRONTMATTER',
        status: 'fail',
        messages: ['opensdd/ directory not found — this is the opensdd project, SKILL.md is required'],
      };
    }
    return { name: 'FRONTMATTER', status: 'skip', messages: ['opensdd/ directory not found, skipping'] };
  }

  let fileList;
  try {
    fileList = fs.readdirSync(skillsDir);
  } catch (err) {
    return { name: 'FRONTMATTER', status: 'fail', messages: [`Failed to read opensdd/ directory: ${err.message}`] };
  }

  const files = fileList
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      return f === 'SKILL.md' || (!/^phase-\d+\.md$/.test(f) && f !== 'finalization.md');
    });

  for (const file of files) {
    const content = readFile(root, 'opensdd', file);
    if (content === null) {
      issues.push(`${file}: failed to read`);
      continue;
    }

    const { data, error } = parseFrontmatter(content);
    if (error) {
      issues.push(`${file}: ${error}`);
      continue;
    }

    if (!getField(data, 'name')) issues.push(`${file}: frontmatter missing 'name' field`);
    if (!getField(data, 'description')) issues.push(`${file}: frontmatter missing 'description' field`);
    if (!getField(data, 'metadata.author')) issues.push(`${file}: frontmatter missing 'metadata.author' field`);
    if (!getField(data, 'metadata.version')) issues.push(`${file}: frontmatter missing 'metadata.version' field`);
  }

  if (issues.length === 0) {
    return {
      name: 'FRONTMATTER',
      status: 'pass',
      messages: [`${files.length} skill files, all with valid frontmatter`],
    };
  }

  return { name: 'FRONTMATTER', status: 'warn', messages: issues };
};

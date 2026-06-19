'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Check that skill files have valid YAML frontmatter.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>} Check result
 */
module.exports = async function check(root, _config) {
  const skillsDir = path.join(root, 'opensdd');
  const issues = [];

  if (!fs.existsSync(skillsDir)) {
    return { name: 'FRONTMATTER', status: 'skip', messages: ['opensdd/ directory not found, skipping'] };
  }

  let fileList;
  try {
    fileList = fs.readdirSync(skillsDir);
  } catch (err) {
    return { name: 'FRONTMATTER', status: 'fail', messages: [`Failed to read opensdd/ directory: ${err.message}`] };
  }

  const files = fileList.filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(skillsDir, file);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      issues.push(`${file}: failed to read — ${err.message}`);
      continue;
    }

    // Check for YAML frontmatter (starts with ---)
    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
      issues.push(`${file}: missing YAML frontmatter (must start with ---)`);
      continue;
    }

    // Find closing ---
    const endIdx = content.indexOf('\n---\n', 4);
    const endIdxCR = content.indexOf('\r\n---\n', 4);
    const endIdxCRLF = content.indexOf('\r\n---\r\n', 4);
    let endPos = -1;
    if (endIdx !== -1) endPos = endIdx;
    if (endIdxCR !== -1 && (endPos === -1 || endIdxCR < endPos)) endPos = endIdxCR;
    if (endIdxCRLF !== -1 && (endPos === -1 || endIdxCRLF < endPos)) endPos = endIdxCRLF;

    if (endPos === -1) {
      issues.push(`${file}: YAML frontmatter has no closing ---`);
      continue;
    }

    const frontmatter = content.substring(4, endPos);

    // Check required fields
    const hasName = /^name\s*:/m.test(frontmatter);
    const hasDescription = /^description\s*:/m.test(frontmatter);
    const hasAuthor = /^metadata\.author\s*:/m.test(frontmatter) || /^metadata:\s*\n.*author\s*:/m.test(frontmatter);
    const hasVersion = /^metadata\.version\s*:/m.test(frontmatter) || /^metadata:\s*\n.*version\s*:/m.test(frontmatter);

    if (!hasName) issues.push(`${file}: frontmatter missing 'name' field`);
    if (!hasDescription) issues.push(`${file}: frontmatter missing 'description' field`);
    if (!hasAuthor) issues.push(`${file}: frontmatter missing 'metadata.author' field`);
    if (!hasVersion) issues.push(`${file}: frontmatter missing 'metadata.version' field`);
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

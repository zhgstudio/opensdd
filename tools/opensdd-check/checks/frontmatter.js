'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Parse YAML frontmatter from a markdown file.
 *
 * @param {string} content - File content
 * @returns {{ data: object|null, error: string|null }} Parsed data or error description
 */
function parseFrontmatter(content) {
  const openMatch = content.match(/^---\r?\n/);
  if (!openMatch) return { data: null, error: 'missing YAML frontmatter (must start with ---)' };

  const openLen = openMatch[0].length;
  const afterOpen = content.slice(openLen);
  const closeMatch = afterOpen.match(/\r?\n---\r?\n/);
  if (!closeMatch) return { data: null, error: 'YAML frontmatter has no closing ---' };

  const yamlStr = content.substring(openLen, openLen + closeMatch.index);

  try {
    const data = yaml.load(yamlStr);
    return { data: typeof data === 'object' && data !== null ? data : {}, error: null };
  } catch (err) {
    return { data: null, error: `YAML parse error: ${err.message}` };
  }
}

/**
 * Extract a field from parsed frontmatter data, supporting both
 * dot-notation (metadata.version) and nested (metadata: { version }) forms.
 *
 * @param {object} data - Parsed YAML data
 * @param {string} dottedPath - Dot-notation path (e.g. "metadata.version")
 * @returns {*} Field value or undefined
 */
function getField(data, dottedPath) {
  const direct = data[dottedPath];
  if (direct !== undefined) return direct;

  const parts = dottedPath.split('.');
  let current = data;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

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

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Extract guidelines from ARCHITECTURE.md public design sections.
 *
 * @param {string} content - ARCHITECTURE.md content
 * @returns {{namingConvention: string|null, namingKeywords: string[], errorFormat: string|null}}
 */
function extractPublicDesign(content) {
  const lines = content.split('\n');
  const sections = {};
  let currentSection = null;
  let inCodeBlock = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const headingMatch = trimmed.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim().toLowerCase();
      sections[currentSection] = [];
      continue;
    }

    if (currentSection && trimmed) {
      sections[currentSection].push(trimmed);
    }
  }

  const namingKeywords = [];
  let errorFormat = null;

  for (const [heading, bodyLines] of Object.entries(sections)) {
    const body = bodyLines.join(' ');

    if (
      /全局编码规范|global coding|coding convention|naming/.test(heading) ||
      /命名风格|naming|camelCase|snake_case|PascalCase/.test(body)
    ) {
      if (/camelCase/i.test(body)) namingKeywords.push('camelCase');
      if (/snake_case/i.test(body)) namingKeywords.push('snake_case');
      if (/PascalCase/i.test(body)) namingKeywords.push('PascalCase');
      if (/kebab-case/i.test(body)) namingKeywords.push('kebab-case');
      if (namingKeywords.length === 0) namingKeywords.push('camelCase');
    }

    if (/公共设计|public design|common design/.test(heading) || /错误|error|Error Envelope/.test(body)) {
      const envMatch = body.match(/Error\s*Envelope|error\s*format|错误.*格式/);
      if (envMatch) errorFormat = envMatch[0];
    }
  }

  return { namingConvention: namingKeywords[0] || null, namingKeywords, errorFormat };
}

/**
 * Extract likely identifier tokens from markdown content.
 *
 * @param {string} content - Document content
 * @returns {{camelCase: string[], snake_case: string[], PascalCase: string[], kebabCase: string[]}}
 */
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const ALLOWED_PASCAL = new Set([
  'Date',
  'String',
  'Number',
  'Boolean',
  'Array',
  'Object',
  'Promise',
  'Error',
  'Map',
  'Set',
  'Symbol',
  'BigInt',
  'RegExp',
  'Buffer',
  'Event',
  'Json',
  'Void',
  'Never',
  'Any',
  'Unknown',
  'Null',
  'Undefined',
  'Id',
  'Url',
  'Uri',
  'Dto',
  'Vo',
  'Po',
  'Do',
  'Api',
]);

function extractIdentifiers(content) {
  const lines = content.split('\n');
  const camelCase = [];
  const snakeCase = [];
  const pascalCase = [];
  const kebabCase = [];

  const seen = new Set();
  let inCodeBlock = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock || trimmed.startsWith('#')) continue;

    const tokens = trimmed.split(/[\s,;(){}[\]<>|=:]+/);

    for (const token of tokens) {
      const cleaned = token.replace(/^[`*_]+|[`*_]+$/g, '');
      if (!cleaned || cleaned.length < 2) continue;
      if (/^\d/.test(cleaned)) continue;
      if (HTTP_METHODS.has(cleaned.toUpperCase())) continue;
      if (ALLOWED_PASCAL.has(cleaned)) continue;

      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;

      if (/^[a-z][a-zA-Z0-9]*$/.test(cleaned) && /[A-Z]/.test(cleaned)) {
        camelCase.push(cleaned);
        seen.add(key);
      } else if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(cleaned)) {
        snakeCase.push(cleaned);
        seen.add(key);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(cleaned) && cleaned.length > 1) {
        pascalCase.push(cleaned);
        seen.add(key);
      } else if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(cleaned)) {
        kebabCase.push(cleaned);
        seen.add(key);
      }
    }
  }

  return { camelCase, snakeCase, pascalCase, kebabCase };
}

/**
 * Assess naming compliance for a single module file.
 *
 * @param {string} moduleDir - Module directory name (e.g., 01-auth)
 * @param {string} fileType - 'INTERFACE.md' or 'INTERNALS.md'
 * @param {string} content - File content
 * @param {{namingConvention: string|null, namingKeywords: string[]}} design - Extracted public design
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {string[]} Compliance issues
 */
function checkNamingCompliance(moduleDir, fileType, content, design, config) {
  const issues = [];
  const rules = config.publicDesignRules || {};

  const expectedConvention = rules.namingConvention || design.namingConvention || 'camelCase';
  if (!expectedConvention) return issues;

  const identifiers = extractIdentifiers(content);
  const allowed = rules.allowedPatterns || [];

  const allTokens = [
    ...identifiers.camelCase.map((t) => ({ token: t, type: 'camelCase' })),
    ...identifiers.snakeCase.map((t) => ({ token: t, type: 'snake_case' })),
    ...identifiers.pascalCase.map((t) => ({ token: t, type: 'PascalCase' })),
    ...identifiers.kebabCase.map((t) => ({ token: t, type: 'kebab-case' })),
  ];

  for (const { token, type } of allTokens) {
    const isAllowed = allowed.some((p) => new RegExp(p).test(token));
    if (isAllowed) continue;

    if (type !== expectedConvention) {
      issues.push(
        `Module '${moduleDir}/${fileType}': identifier '${token}' uses ${type} but expected ${expectedConvention}`,
      );
    }
  }

  return issues;
}

/**
 * Check public design compliance across all modules.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>}
 */
async function checkPublicDesignCompliance(root, config) {
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'skip',
      messages: ['docs/ARCHITECTURE.md not found, skipping'],
    };
  }

  let archContent;
  try {
    archContent = fs.readFileSync(archPath, 'utf-8');
  } catch (err) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'fail',
      messages: [`Failed to read ARCHITECTURE.md: ${err.message}`],
    };
  }

  const design = extractPublicDesign(archContent);

  if (
    !design.namingConvention &&
    !design.errorFormat &&
    (!config.publicDesignRules || !config.publicDesignRules.namingConvention)
  ) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'skip',
      messages: ['No public design rules found in ARCHITECTURE.md or .sddrc.json, skipping'],
    };
  }

  const modulesDir = path.join(root, 'docs/modules');
  if (!fs.existsSync(modulesDir)) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'skip',
      messages: ['docs/modules/ not found, skipping'],
    };
  }

  let entries;
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch (err) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'fail',
      messages: [`Failed to read docs/modules/: ${err.message}`],
    };
  }

  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const issues = [];
  let checkedModules = 0;

  for (const moduleDir of moduleDirs) {
    if (!new RegExp(config.moduleDirPattern).test(moduleDir)) continue;

    const modulePath = path.join(modulesDir, moduleDir);

    for (const fileType of ['INTERFACE.md', 'INTERNALS.md']) {
      const filePath = path.join(modulePath, fileType);
      if (!fs.existsSync(filePath)) continue;

      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (_) {
        continue;
      }

      checkedModules++;
      issues.push(...checkNamingCompliance(moduleDir, fileType, content, design, config));
    }
  }

  if (checkedModules === 0) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'warn',
      messages: ['No module files found to check'],
    };
  }

  if (issues.length === 0) {
    return {
      name: 'PUBLIC_DESIGN_COMPLIANCE',
      status: 'pass',
      messages: [
        `${checkedModules} module files checked, all compliant with public design` +
          (design.namingConvention ? ` (${design.namingConvention})` : ''),
      ],
    };
  }

  return {
    name: 'PUBLIC_DESIGN_COMPLIANCE',
    status: 'fail',
    messages: issues,
  };
}

module.exports = async function check(root, config) {
  return checkPublicDesignCompliance(root, config);
};

module.exports.extractPublicDesign = extractPublicDesign;
module.exports.extractIdentifiers = extractIdentifiers;

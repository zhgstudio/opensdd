'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Split a markdown table row into cell values.
 * Handles 3-column and 4-column tables.
 *
 * @param {string} trimmed - Trimmed table row string
 * @returns {string[]|null} Array of cell values, or null if not a valid row
 */
function splitRow(trimmed) {
  // Separator rows (|---|----|---|) are not data rows:
  // after removing pipes and whitespace, only - and : should remain
  const stripped = trimmed.replace(/[\s|]/g, '');
  if (/^[-:]+$/.test(stripped)) return null;

  // Match 3 or 4 cells: | cell | cell | cell |  or  | cell | cell | cell | cell |
  const re3 = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/;
  const re4 = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/;

  let match = trimmed.match(re4);
  if (match) return [match[1].trim(), match[2].trim(), match[3].trim(), match[4].trim()];

  match = trimmed.match(re3);
  if (match) return [match[1].trim(), match[2].trim(), match[3].trim()];

  return null;
}

/**
 * Parse markdown table after "模块引用表" heading.
 *
 * @param {string} content - File content
 * @returns {Array<{name: string, description: string, ref: string}>} Parsed module entries
 */
function parseModuleTable(content) {
  const lines = content.split('\n');
  const modules = [];
  let inTable = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    // detect heading (Chinese or English keywords for reference table)
    if (/^#{1,6}\s*(模块引用表|module reference table)/i.test(trimmed)) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;

    // skip separator rows (|----|----|---|)
    if (/^\|[\s\-:]+\|/.test(trimmed)) continue;

    // detect table row
    const cells = splitRow(trimmed);
    if (cells) {
      // skip header row
      const firstCell = cells[0].toLowerCase();
      if (firstCell === '编号' || firstCell === 'module') continue;

      // Module reference table has 4 columns: 编号, 模块名, 功能简述, 详细设计
      // or 3 columns: Module, Name, Design
      // Reconstruct full NN-name from number + name (e.g., "01" + "auth" → "01-auth")
      const num = cells[0];
      const modName = cells[1];
      const fullName = /^\d{2}$/.test(num) ? `${num}-${modName}` : num;

      if (cells.length >= 4) {
        modules.push({
          name: fullName,
          description: modName,
          ref: cells[3],
        });
      } else {
        modules.push({
          name: fullName,
          description: modName,
          ref: cells[2] || '',
        });
      }
      continue;
    }

    // if we hit another heading after finding rows, stop scanning
    if (/^#{1,6}\s/.test(trimmed)) {
      if (modules.length > 0) break;
    }
  }

  return modules;
}

/**
 * Parse dependency matrix columns: | 模块 | 依赖 | 所需接口 |.
 *
 * @param {string} content - File content
 * @returns {Array<{name: string, depends: string, interface: string}>} Parsed dependency entries
 */
function parseDependencyMatrix(content) {
  const lines = content.split('\n');
  const modules = [];
  let inMatrix = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    // detect heading (Chinese or English)
    if (/^#{1,6}\s*(模块依赖矩阵|模块依赖|module dep|dependency matrix)/i.test(trimmed)) {
      inMatrix = true;
      continue;
    }

    if (!inMatrix) continue;

    // skip separator rows (|----|----|---|)
    if (/^\|[\s\-:]+\|/.test(trimmed)) continue;

    // detect table row: | cell | cell | cell |
    const rowMatch = trimmed.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
    if (rowMatch) {
      // skip header row (检查任意列的关键字)
      const firstCell = rowMatch[1].toLowerCase().trim();
      if (firstCell === '模块' || firstCell === 'module') continue;

      modules.push({
        name: rowMatch[1].trim(),
        depends: rowMatch[2].trim(),
        interface: rowMatch[3].trim(),
      });
      continue;
    }

    // if we hit another heading after finding rows, stop scanning
    if (/^#{1,6}\s/.test(trimmed)) {
      if (modules.length > 0) break;
    }
  }

  return modules;
}

/**
 * Check that module directories referenced in ARCHITECTURE.md exist.
 *
 * @param {string} root - Absolute path to the project root
 * @param {import('../config').SddConfig} config - SDD configuration
 * @returns {Promise<{name: string, status: string, messages: string[]}>} Check result
 */
/**
 * Parse a dependency string (e.g. "01-auth, 03-api-gateway") into individual module names.
 *
 * @param {string} depStr - Raw dependency string from the dependency matrix
 * @returns {string[]} Array of individual dependency module names
 */
function parseDependencies(depStr) {
  return depStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = async function check(root, config) {
  const MODULE_DIR_RE = new RegExp(config.moduleDirPattern);
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return { name: 'DEP_MATRIX', status: 'skip', messages: ['docs/ARCHITECTURE.md not found, skipping'] };
  }

  let content;
  try {
    content = fs.readFileSync(archPath, 'utf-8');
  } catch (err) {
    return { name: 'DEP_MATRIX', status: 'fail', messages: [`Failed to read ARCHITECTURE.md: ${err.message}`] };
  }

  const moduleTable = parseModuleTable(content);
  const depMatrix = parseDependencyMatrix(content);

  // Collect module names from both tables
  const moduleNames = new Set();
  for (const m of moduleTable) {
    if (m.name) moduleNames.add(m.name);
  }
  for (const m of depMatrix) {
    if (m.name) moduleNames.add(m.name);
  }

  if (moduleNames.size === 0) {
    return {
      name: 'DEP_MATRIX',
      status: 'warn',
      messages: ['No module reference table or dependency matrix found in ARCHITECTURE.md'],
    };
  }

  const issues = [];

  for (const name of moduleNames) {
    // Check module name follows NN-name format
    if (!MODULE_DIR_RE.test(name)) {
      issues.push(`Module '${name}' does not follow NN-name format (e.g. 01-auth)`);
      continue;
    }

    const dirPath = path.join(root, 'docs/modules', name);
    const interfacePath = path.join(dirPath, 'INTERFACE.md');

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      issues.push(`Module '${name}' declared but missing from docs/modules/`);
    } else if (!fs.existsSync(interfacePath)) {
      issues.push(`Module '${name}' directory exists but INTERFACE.md not found`);
    }
  }

  // Validate each dependency reference in the dependency matrix
  const NO_DEP = /^(-|none|null|n\/a|)$/i;
  for (const entry of depMatrix) {
    const deps = parseDependencies(entry.depends);
    for (const dep of deps) {
      if (NO_DEP.test(dep)) continue;
      if (!MODULE_DIR_RE.test(dep)) {
        issues.push(`Dependency '${dep}' in matrix entry '${entry.name}' does not follow NN-name format`);
      } else if (!moduleNames.has(dep)) {
        issues.push(
          `Dependency '${dep}' declared in matrix entry '${entry.name}' is not defined in module reference table`,
        );
      }
    }
  }

  if (issues.length === 0) {
    return {
      name: 'DEP_MATRIX',
      status: 'pass',
      messages: [`${moduleNames.size} modules in matrix, all have docs/modules/{NN}-{name}/INTERFACE.md`],
    };
  }

  // Check for orphan module directories (exist in docs/modules/ but not declared in ARCHITECTURE.md)
  const modulesDir = path.join(root, 'docs/modules');
  if (fs.existsSync(modulesDir)) {
    let entries;
    try {
      entries = fs.readdirSync(modulesDir, { withFileTypes: true });
    } catch (err) {
      issues.push(`Failed to list modules directory: ${err.message}`);
    }

    if (entries) {
      for (const entry of entries) {
        if (entry.isDirectory() && MODULE_DIR_RE.test(entry.name)) {
          if (!moduleNames.has(entry.name)) {
            issues.push(
              `Orphan module directory 'docs/modules/${entry.name}' exists but is not declared in ARCHITECTURE.md module reference table`,
            );
          }
        }
      }
    }
  }

  return {
    name: 'DEP_MATRIX',
    status: 'fail',
    messages: issues,
  };
};

module.exports.parseModuleTable = parseModuleTable;
module.exports.parseDependencyMatrix = parseDependencyMatrix;
module.exports.parseDependencies = parseDependencies;

/** @package */
module.exports.splitRow = splitRow;

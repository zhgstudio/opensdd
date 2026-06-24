'use strict';

const { splitLines } = require('../../lib/line-split');

/**
 * Function/method signature interface strategy.
 * Matches patterns like:
 *   funcName(param1: Type, param2: Type): ReturnType
 *   validateToken(token: string): Claims
 *   fnName(param) -> ret
 *
 * Also matches plain function names in list items:
 *   - validateToken
 *   - generateJwt(user)
 */

/**
 * Extract function signature definitions from markdown content.
 *
 * @param {string} content - Document content
 * @returns {import('./index').InterfaceDefinition[]}
 */
function extract(content) {
  const functions = [];
  const lines = splitLines(content);
  let inCodeBlock = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Skip headings and non-content lines
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) continue;

    // Pattern 1: funcName(params) -> return or funcName(params): return
    // e.g. validateToken(token: string): Claims
    // Handles optional generic type params: funcName<T>(...)
    let fnMatch = trimmed.match(/([a-zA-Z_]\w*)(?:<[^>]*>)?\s*\(\s*([^)]*)\s*\)\s*(?::|->|=>)\s*(.+)$/);
    if (fnMatch) {
      const name = fnMatch[1];
      const params = fnMatch[2].trim();
      const returnType = fnMatch[3].trim();
      const paramList = params
        ? params
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [];
      functions.push({
        signature: `${name}(${params}): ${returnType}`,
        type: 'function',
        details: { name, params: paramList, returnType },
      });
      continue;
    }

    // Pattern 2: funcName(params) — no return type
    // e.g. validateToken(token)
    fnMatch = trimmed.match(/([a-zA-Z_]\w*)(?:<[^>]*>)?\s*\(\s*([^)]*)\s*\)\s*$/);
    if (fnMatch) {
      const name = fnMatch[1];
      const params = fnMatch[2].trim();
      const paramList = params
        ? params
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [];
      functions.push({
        signature: `${name}(${params})`,
        type: 'function',
        details: { name, params: paramList, returnType: null },
      });
      continue;
    }

    // Pattern 3: Plain function name in list items (no params notation)
    // e.g. - validateToken  or  * generateJwt
    const listMatch = trimmed.match(/^[-*]\s+([a-zA-Z_]\w*)$/);
    if (listMatch) {
      const name = listMatch[1];
      functions.push({
        signature: name,
        type: 'function',
        details: { name, params: [], returnType: null },
      });
    }
  }

  return functions;
}

/**
 * Check if a required interface string matches extracted function definitions.
 * Required format:
 *   - "funcName" (matches by name only)
 *   - "funcName(param1, param2): ReturnType" (matches name + params + return)
 *   - "funcName(params)" (matches name + params)
 *
 * @param {string} required - Required interface string
 * @param {import('./index').InterfaceDefinition[]} definitions - Extracted definitions
 * @returns {boolean} Whether a matching definition was found
 */
function matchRequired(required, definitions) {
  const trimmed = required.trim();

  // Try full signature: funcName(params): returnType
  let fnMatch = trimmed.match(/^([a-zA-Z_]\w*)(?:<[^>]*>)?\s*\(\s*([^)]*)\s*\)\s*(?::|->|=>)\s*(.+)$/);
  if (fnMatch) {
    const name = fnMatch[1];
    const requiredParams = fnMatch[2]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const requiredReturn = fnMatch[3].trim();
    return definitions.some((d) => {
      if (d.type !== 'function' || d.details.name !== name) return false;
      if (d.details.params.length !== requiredParams.length) return false;
      if (d.details.returnType !== requiredReturn) return false;
      return true;
    });
  }

  // Try name + params: funcName(params)
  fnMatch = trimmed.match(/^([a-zA-Z_]\w*)(?:<[^>]*>)?\s*\(\s*([^)]*)\s*\)$/);
  if (fnMatch) {
    const name = fnMatch[1];
    const requiredParams = fnMatch[2]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return definitions.some(
      (d) => d.type === 'function' && d.details.name === name && d.details.params.length === requiredParams.length,
    );
  }

  // Try bare name: funcName
  const nameMatch = trimmed.match(/^([a-zA-Z_]\w*)$/);
  if (nameMatch) {
    const name = nameMatch[1];
    return definitions.some((d) => d.type === 'function' && d.details.name === name);
  }

  return false;
}

module.exports = { name: 'function', extract, matchRequired };

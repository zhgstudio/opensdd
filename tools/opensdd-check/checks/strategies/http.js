'use strict';

const { splitLines } = require('../../lib/line-split');

/**
 * HTTP REST interface strategy.
 * Matches patterns like: GET /path, POST /auth/login, PUT /resource/:id
 */

/**
 * Extract HTTP endpoint definitions from markdown content.
 *
 * @param {string} content - Document content
 * @returns {import('./index').InterfaceDefinition[]}
 */
function extract(content) {
  const endpoints = [];
  const lines = splitLines(content);

  for (const raw of lines) {
    const trimmed = raw.trim();

    // Strip markdown list markers (- , * , 1.) and table cell pipes
    const cleaned = trimmed
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/^\||\|$/g, '')
      .trim();
    const candidates = [trimmed, cleaned].filter((s, i, a) => a.indexOf(s) === i);

    for (const text of candidates) {
      if (!text) continue;
      // Match METHOD /path at line start
      const methodPathMatch = text.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+(\/\S+)/i);
      if (methodPathMatch) {
        endpoints.push({
          signature: `${methodPathMatch[1].toUpperCase()} ${methodPathMatch[2]}`,
          type: 'http',
          details: {
            method: methodPathMatch[1].toUpperCase(),
            path: methodPathMatch[2],
          },
        });
        break;
      }

      // Match `METHOD /path` inside backticks
      const codeMatch = text.match(/`(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+(\/\S+)`/i);
      if (codeMatch) {
        endpoints.push({
          signature: `${codeMatch[1].toUpperCase()} ${codeMatch[2]}`,
          type: 'http',
          details: {
            method: codeMatch[1].toUpperCase(),
            path: codeMatch[2],
          },
        });
        break;
      }
    }
  }

  return endpoints;
}

/**
 * Check if a required interface string matches a list of extracted definitions.
 * Required format: "METHOD /path" (e.g. "POST /auth/login")
 *
 * @param {string} required - Required interface string
 * @param {import('./index').InterfaceDefinition[]} definitions - Extracted definitions
 * @returns {boolean} Whether a matching definition was found
 */
function matchRequired(required, definitions) {
  const methodPathMatch = required.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT)\s+(\/\S+)/i);
  if (!methodPathMatch) return false;

  const requiredMethod = methodPathMatch[1].toUpperCase();
  const requiredPath = methodPathMatch[2];

  return definitions.some(
    (d) => d.type === 'http' && d.details.method === requiredMethod && d.details.path === requiredPath,
  );
}

module.exports = { name: 'http', extract, matchRequired };

'use strict';

const httpStrategy = require('./http');
const grpcStrategy = require('./grpc');
const functionStrategy = require('./function');

/**
 * @typedef {object} InterfaceDefinition
 * @property {string} signature - Full signature string for display
 * @property {string} type - Interface type tag (e.g. "http", "grpc", "function")
 * @property {object} [details] - Strategy-specific structured info
 */

/**
 * @typedef {object} InterfaceStrategy
 * @property {string} name - Strategy identifier
 * @property {function(string): InterfaceDefinition[]} extract
 *   Extract interface definitions from document content.
 * @property {function(string, InterfaceDefinition[]): boolean} matchRequired
 *   Check if a required interface string matches any defined interface.
 */

const STRATEGIES = {
  http: httpStrategy,
  grpc: grpcStrategy,
  function: functionStrategy,
};

/**
 * Get a strategy by name.
 * Falls back to http on unknown names.
 *
 * @param {string} name - Strategy name ('http', 'grpc', 'function')
 * @returns {InterfaceStrategy}
 */
function getStrategy(name) {
  const key = name.toLowerCase();
  if (STRATEGIES[key]) return STRATEGIES[key];
  console.warn(`Warning: Unknown interface strategy "${name}", falling back to "http"`);
  return STRATEGIES.http;
}

/**
 * Auto-detect the best strategy from document content.
 * Scores each strategy by number of matches across all documents.
 * Tie-breaking: prefers more specific strategies in order: grpc > function > http.
 * gRPC patterns are least likely to be false positives, HTTP patterns most likely.
 *
 * @param {string[]} contents - Array of document content strings
 * @returns {InterfaceStrategy}
 */
function detect(contents) {
  const scores = { http: 0, grpc: 0, function: 0 };

  for (const content of contents) {
    if (!content) continue;
    // Count matches per strategy using their extract() results
    for (const [name, strategy] of Object.entries(STRATEGIES)) {
      scores[name] += strategy.extract(content).length;
    }
  }

  // If no matches: default to http (most common convention)
  const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalMatches === 0) {
    return STRATEGIES.http;
  }

  // Tie-breaking order: grpc > function > http (specificity descending)
  const specificity = ['grpc', 'function', 'http'];
  let best = 'http';
  let bestScore = 0;
  for (const name of specificity) {
    if (scores[name] > bestScore) {
      bestScore = scores[name];
      best = name;
    }
  }

  return STRATEGIES[best];
}

module.exports = { getStrategy, detect, STRATEGIES };

'use strict';

const httpStrategy = require('./http');
const grpcStrategy = require('./grpc');
const functionStrategy = require('./function');

/**
 * @typedef {Object} InterfaceDefinition
 * @property {string} signature - Full signature string for display
 * @property {string} type - Interface type tag (e.g. "http", "grpc", "function")
 * @property {Object} [details] - Strategy-specific structured info
 */

/**
 * @typedef {Object} InterfaceStrategy
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

  // Pick the strategy with the most matches
  let best = 'http';
  let bestScore = 0;
  for (const [name, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  return STRATEGIES[best];
}

module.exports = { getStrategy, detect, STRATEGIES };

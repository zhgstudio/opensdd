'use strict';

/**
 * Split content into lines, handling both LF and CRLF line endings.
 *
 * @param {string} content - Raw file content
 * @returns {string[]} Array of lines (without line ending characters)
 */
function splitLines(content) {
  return content.split(/\r?\n/);
}

module.exports = { splitLines };

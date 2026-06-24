'use strict';

const { splitLines } = require('../../lib/line-split');

/**
 * gRPC / protobuf interface strategy.
 * Matches patterns like:
 *   rpc Method(ReqType) returns (RespType)
 *   rpc Login(LoginRequest) returns (LoginResponse)
 * Also matches service.method qualified names.
 */

/**
 * Extract gRPC method definitions from markdown content.
 *
 * @param {string} content - Document content
 * @returns {import('./index').InterfaceDefinition[]}
 */
function extract(content) {
  const methods = [];
  const lines = splitLines(content);
  let inCodeBlock = false;
  // Stack for tracking service block nesting
  let currentService = null;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Track service blocks FIRST — before rpc match, so currentService is set
    // even when rpc and service declaration are on the same line.
    const serviceMatch = trimmed.match(/^service\s+([A-Za-z_]\w*)\s*\{/);
    if (serviceMatch) {
      currentService = serviceMatch[1];
    }

    // Match rpc method inside code block or plain text
    // Pattern: rpc MethodName(RequestType) returns (ResponseType)
    // Also handles stream types: returns (stream Event) or returns (Event)
    const typePattern = '(?:stream\\s+)?[A-Za-z_]\\w*';
    const rpcMatch = trimmed.match(
      new RegExp(
        `rpc\\s+([A-Za-z_]\\w*)\\s*\\(\\s*(${typePattern})\\s*\\)\\s*returns\\s*\\(\\s*(${typePattern})\\s*\\)`,
      ),
    );
    if (rpcMatch) {
      const methodName = rpcMatch[1];
      const fullName = currentService ? `${currentService}.${methodName}` : methodName;
      methods.push({
        signature: `rpc ${fullName}(${rpcMatch[2]}) returns (${rpcMatch[3]})`,
        type: 'grpc',
        details: {
          service: currentService,
          method: methodName,
          requestType: rpcMatch[2],
          responseType: rpcMatch[3],
          fullName,
        },
      });
      continue;
    }

    // Closing brace of service block
    if (currentService && /^\s*\}\s*$/.test(trimmed)) {
      currentService = null;
    }
  }

  return methods;
}

/**
 * Check if a required interface string matches extracted gRPC definitions.
 * Required format:
 *   - "Service.Method" (qualified)
 *   - "Method" (unqualified — matches any service)
 *   - "rpc Method(Req) returns (Resp)" (full proto signature)
 *
 * @param {string} required - Required interface string
 * @param {import('./index').InterfaceDefinition[]} definitions - Extracted definitions
 * @returns {boolean} Whether a matching definition was found
 */
function matchRequired(required, definitions) {
  const trimmed = required.trim();

  // Try qualified form: Service.Method
  const qualifiedMatch = trimmed.match(/^([A-Za-z_]\w*)\.([A-Za-z_]\w*)$/);
  if (qualifiedMatch) {
    const [, service, method] = qualifiedMatch;
    return definitions.some((d) => d.type === 'grpc' && d.details.method === method && d.details.service === service);
  }

  // Try unqualified method name
  const methodMatch = trimmed.match(/^([A-Za-z_]\w*)$/);
  if (methodMatch) {
    const method = methodMatch[1];
    return definitions.some((d) => d.type === 'grpc' && d.details.method === method);
  }

  // Try full rpc signature
  const rpcMatch = trimmed.match(
    /^rpc\s+([A-Za-z_]\w*)\s*\(\s*((?:stream\s+)?[A-Za-z_]\w*)\s*\)\s*returns\s*\(\s*((?:stream\s+)?[A-Za-z_]\w*)\s*\)$/,
  );
  if (rpcMatch) {
    const method = rpcMatch[1];
    const reqType = rpcMatch[2];
    const resType = rpcMatch[3];
    return definitions.some(
      (d) =>
        d.type === 'grpc' &&
        d.details.method === method &&
        d.details.requestType === reqType &&
        d.details.responseType === resType,
    );
  }

  return false;
}

module.exports = { name: 'grpc', extract, matchRequired };

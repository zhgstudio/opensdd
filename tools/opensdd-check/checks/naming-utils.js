'use strict';

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const DEFAULT_PASCAL_PATTERNS = [
  '^(Date|String|Number|Boolean|Array|Object|Promise|Error|Map|Set|Symbol|BigInt|RegExp|Buffer|Event|Json|Void|Never|Any|Unknown|Null|Undefined|Id|Url|Uri|Dto|Vo|Po|Do|Api)$',
  '^I[A-Z][a-z]+[A-Za-z]*$',
  '^[A-Z][a-z]+(Request|Response|Dto|Vo|Po|Do|Event|Command|Query|Handler|Service|Controller|Repository|Factory|Builder|Provider|Module|Config|Exception|Manager|Helper|Util|Utils|Model|Entity|View|Model|Input|Output|Result|Payload|Header|Body|Params|Option|Options|Context|Interceptor|Guard|Pipe|Filter|Adapter|Strategy|Converter|Mapper|Transformer|Validator|Resolver|Loader|Writer|Reader|Client|Server|Gateway|Proxy|Facade|Singleton|Prototype|State|Strategy|Observer|Listener|Publisher|Subscriber|Producer|Consumer|Task|Job)$',
];

function isPascalCaseAllowed(token, config) {
  const rules = config.publicDesignRules || {};
  const patterns = rules.pascalCaseAllowedPatterns || DEFAULT_PASCAL_PATTERNS;
  for (const pattern of patterns) {
    if (new RegExp(pattern).test(token)) return true;
  }
  return false;
}

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

    if (type === 'PascalCase' && isPascalCaseAllowed(token, config)) continue;

    if (type !== expectedConvention) {
      issues.push(
        `Module '${moduleDir}/${fileType}': identifier '${token}' uses ${type} but expected ${expectedConvention}`,
      );
    }
  }

  return issues;
}

module.exports = { extractIdentifiers, isPascalCaseAllowed, checkNamingCompliance, DEFAULT_PASCAL_PATTERNS };

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @typedef {object} AgentSection
 * @property {string} heading - Required section heading (exact match)
 */

/**
 * @typedef {object} SddConfig
 * @property {string[]} requiredFiles - List of required file paths relative to root
 * @property {AgentSection[]} requiredAgentSections - Required sections for AGENTS.md
 * @property {string} taskRegex - Regex pattern for task line format in PLAN.md
 * @property {string} moduleDirPattern - Regex pattern for module directory names
 * @property {string} interfaceStrategy - Interface check strategy ('http'|'grpc'|'function'|'auto')
 * @property {string[]} requiredApiSections - Required section keywords for API.md
 * @property {string[]} requiredDesignSections - Required section keywords for DESIGN.md
 */

/**
 * Default SDD configuration.
 * @type {SddConfig}
 */
const DEFAULT_CONFIG = {
  requiredFiles: ['docs/SPEC.md', 'docs/ARCHITECTURE.md', 'docs/PLAN.md', 'AGENTS.md'],
  requiredAgentSections: [
    { heading: '文件/目录权限' },
    { heading: '提交规范' },
    { heading: '测试要求' },
    { heading: '升级条件' },
    { heading: '跨模块规则' },
    { heading: '决策记录机制' },
    { heading: '模块目录说明' },
    { heading: 'PLAN.md 任务规范' },
  ],
  taskRegex: '^\\-\\s+\\[([ x])\\]\\s+(T-[A-Z]+(?:-[A-Z]+)*-\\d+)\\s*:\\s*(.+)$',
  moduleDirPattern: '^\\d{2}-[a-zA-Z0-9_-]+$',
  requiredApiSections: ['模块概述与职责边界', '核心数据结构', '接口定义'],
  requiredDesignSections: ['核心逻辑流程', '内部实现细节', '功能特性列表'],
  interfaceStrategy: 'auto',
};

const CONFIG_SCHEMA = {
  requiredFiles: 'string[]',
  requiredAgentSections: 'object[]',
  taskRegex: 'string',
  moduleDirPattern: 'string',
  interfaceStrategy: ['auto', 'http', 'grpc', 'function'],
  requiredApiSections: 'string[]',
  requiredDesignSections: 'string[]',
};

/**
 * Validate user config values against expected types/values.
 * Prints warnings for type mismatches and invalid enum values.
 *
 * @param {Partial<SddConfig>} user - User configuration
 */
function validateConfig(user) {
  for (const [key, value] of Object.entries(user)) {
    const expected = CONFIG_SCHEMA[key];
    if (!expected) continue; // unknown keys handled elsewhere

    if (Array.isArray(expected)) {
      if (!expected.includes(value)) {
        console.warn(`Warning: "${key}" is "${String(value)}", expected one of: ${expected.join(', ')}`);
      }
    } else if (expected.endsWith('[]')) {
      if (!Array.isArray(value)) {
        console.warn(`Warning: "${key}" should be an array, got ${typeof value}`);
      }
    } else if (typeof value !== expected) {
      console.warn(`Warning: "${key}" should be ${expected}, got ${typeof value}`);
    }
  }
}

/**
 * Load SDD configuration from `.sddrc.json` in the given root directory.
 * Merges with defaults — user config overrides matching keys.
 *
 * @param {SddConfig} defaults - Default configuration
 * @param {SddConfig} user - User configuration to merge
 * @returns {SddConfig} Merged configuration object
 */
function mergeConfig(defaults, user) {
  const result = { ...defaults };
  for (const key of Object.keys(user)) {
    if (Array.isArray(defaults[key]) && Array.isArray(user[key])) {
      // Arrays replace defaults entirely (user's config takes precedence)
      result[key] = user[key];
    } else if (
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key]) &&
      typeof user[key] === 'object' &&
      user[key] !== null &&
      !Array.isArray(user[key])
    ) {
      // Nested objects merge recursively
      result[key] = { ...defaults[key], ...user[key] };
    } else if (defaults[key] !== undefined) {
      // Known keys: user overrides
      result[key] = user[key];
    }
    // Unknown keys are dropped (caller warns on unknown keys)
  }
  return result;
}

function loadConfig(root) {
  const configPath = path.join(root, '.sddrc.json');

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    /** @type {Partial<SddConfig>} */
    const userConfig = JSON.parse(raw);

    // Warn about unknown config keys (likely typos)
    const knownKeys = Object.keys(DEFAULT_CONFIG);
    for (const key of Object.keys(userConfig)) {
      if (!knownKeys.includes(key)) {
        console.warn(`Warning: Unknown config key "${key}" in .sddrc.json (typo?)`);
      }
    }

    validateConfig(userConfig);

    return mergeConfig(DEFAULT_CONFIG, userConfig);
  } catch (err) {
    console.warn(`Warning: Failed to parse ${configPath}: ${err.message}`);
    return { ...DEFAULT_CONFIG };
  }
}

module.exports = { loadConfig, mergeConfig, DEFAULT_CONFIG };

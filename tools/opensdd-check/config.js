'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} AgentSection
 * @property {string[]} keywords - List of keywords to match against headings
 */

/**
 * @typedef {Object} SddConfig
 * @property {string[]} requiredFiles - List of required file paths relative to root
 * @property {AgentSection[]} requiredAgentSections - Required sections for AGENTS.md
 * @property {string[]} garbagePatterns - Regex patterns for garbage file detection
 * @property {string} taskRegex - Regex pattern for task line format in PLAN.md
 * @property {string} moduleDirPattern - Regex pattern for module directory names
 * @property {string} interfaceStrategy - Interface check strategy ('http'|'grpc'|'function'|'auto')
 * @property {Object} [publicDesignRules] - Public design compliance rules
 * @property {string} [publicDesignRules.namingConvention] - Expected naming convention ('camelCase', 'snake_case', etc.)
 * @property {string[]} [publicDesignRules.allowedPatterns] - Allowed identifier regex patterns for exceptions
 */

/**
 * Default SDD configuration.
 * @type {SddConfig}
 */
const DEFAULT_CONFIG = {
  requiredFiles: ['docs/SPEC.md', 'docs/ARCHITECTURE.md', 'docs/PLAN.md', 'AGENTS.md'],
  requiredAgentSections: [
    { keywords: ['文件操作范围', 'file operation scope', 'file access scope'] },
    { keywords: ['提交规范', 'commit specification', 'commit convention', 'commit message'] },
    { keywords: ['测试要求', 'test requirement', 'test coverage', '测试覆盖'] },
    { keywords: ['升级条件', 'escalation condition', 'human介入', 'human intervention', 'pause and ask', '请求人类'] },
    { keywords: ['跨模块规则', 'cross-module rule', 'cross module rule', '模块间'] },
    { keywords: ['plan.md', '任务规范', 'task convention', '任务标记'] },
  ],
  garbagePatterns: ['_v\\d+', '_final', '_tmp\\w*', '_old', '_backup', '\\.bak', '-v\\d+'],
  taskRegex: '^\\-\\s+\\[([ x])\\]\\s+(T-\\d+)\\s*:\\s*(.+)$',
  moduleDirPattern: '^\\d{2}-[a-zA-Z0-9_-]+$',
  requiredInterfaceSections: ['模块概述与职责边界', '核心数据结构', '接口定义'],
  requiredInternalsSections: ['核心逻辑流程', '内部实现细节', '功能特性列表'],
  interfaceStrategy: 'auto',
  skipDirs: ['node_modules', '.git', '.github'],
  publicDesignRules: {
    namingConvention: 'camelCase',
    allowedPatterns: [],
  },
};

/**
 * Load SDD configuration from `.sddrc.json` in the given root directory.
 * Merges with defaults — user config overrides matching keys.
 *
 * @param {string} root - Absolute path to the project root directory
 * @returns {SddConfig} Merged configuration object
 */
function mergeConfig(defaults, user) {
  const result = { ...defaults };
  for (const key of Object.keys(user)) {
    if (Array.isArray(defaults[key]) && Array.isArray(user[key])) {
      // Arrays extend (don't replace)
      result[key] = [...defaults[key], ...user[key]];
    } else if (defaults[key] !== undefined) {
      // Known keys: user overrides
      result[key] = user[key];
    }
    // Unknown keys are silently ignored
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

    return mergeConfig(DEFAULT_CONFIG, userConfig);
  } catch (err) {
    console.error(`Warning: Failed to parse ${configPath}: ${err.message}`);
    return { ...DEFAULT_CONFIG };
  }
}

module.exports = { loadConfig, mergeConfig, DEFAULT_CONFIG };

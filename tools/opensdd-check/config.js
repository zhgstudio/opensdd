'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @typedef {object} AgentSection
 * @property {string[]} keywords - List of keywords to match against headings
 */

/**
 * @typedef {object} SddConfig
 * @property {string[]} requiredFiles - List of required file paths relative to root
 * @property {AgentSection[]} requiredAgentSections - Required sections for AGENTS.md
 * @property {string[]} garbagePatterns - Regex patterns for garbage file detection
 * @property {string} taskRegex - Regex pattern for task line format in PLAN.md
 * @property {string} moduleDirPattern - Regex pattern for module directory names
 * @property {string} interfaceStrategy - Interface check strategy ('http'|'grpc'|'function'|'auto')
 * @property {object} [publicDesignRules] - Public design compliance rules
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
    { keywords: ['文件操作范围', 'file operation scope', 'file access scope', '文件访问范围', '读写范围', '目录范围'] },
    {
      keywords: [
        '提交规范',
        'commit specification',
        'commit convention',
        'commit message',
        'git 规范',
        '提交约定',
        'commit 格式',
      ],
    },
    { keywords: ['测试要求', 'test requirement', 'test coverage', '测试覆盖', '测试规范', 'testing', '单元测试'] },
    {
      keywords: [
        '升级条件',
        'escalation condition',
        'human介入',
        'human intervention',
        'pause and ask',
        '请求人类',
        '上报条件',
        '升级规则',
        '暂停条件',
        '人工介入',
      ],
    },
    { keywords: ['跨模块规则', 'cross-module rule', 'cross module rule', '模块间', '跨模块', '模块依赖', '模块通信'] },
    {
      keywords: [
        'plan.md',
        '任务规范',
        'task convention',
        '任务标记',
        '任务格式',
        '任务约定',
        'task format',
        '任务追踪',
      ],
    },
  ],
  garbagePatterns: ['_v\\d+', '_final', '_tmp\\w*', '_old', '_backup', '\\.bak', '-v\\d+'],
  taskRegex: '^\\-\\s+\\[([ x])\\]\\s+(T-\\d+)\\s*:\\s*(.+)$',
  moduleDirPattern: '^\\d{2}-[a-zA-Z0-9_-]+$',
  requiredApiSections: ['模块概述与职责边界', '核心数据结构', '接口定义'],
  requiredDesignSections: ['核心逻辑流程', '内部实现细节', '功能特性列表'],
  interfaceStrategy: 'auto',
  skipDirs: ['node_modules', '.git', '.github'],
  publicDesignRules: {
    namingConvention: 'camelCase',
    allowedPatterns: [],
    pascalCaseAllowedPatterns: [
      '^(Date|String|Number|Boolean|Array|Object|Promise|Error|Map|Set|Symbol|BigInt|RegExp|Buffer|Event|Json|Void|Never|Any|Unknown|Null|Undefined|Id|Url|Uri|Dto|Vo|Po|Do|Api)$',
      '^I[A-Z][a-z]+[A-Za-z]*$',
      '^[A-Z][a-z]+(Request|Response|Dto|Vo|Po|Do|Event|Command|Query|Handler|Service|Controller|Repository|Factory|Builder|Provider|Module|Config|Exception|Manager|Helper|Util|Utils|Model|Entity|View|Model|Input|Output|Result|Payload|Header|Body|Params|Option|Options|Context|Interceptor|Guard|Pipe|Filter|Adapter|Strategy|Converter|Mapper|Transformer|Validator|Resolver|Loader|Writer|Reader|Client|Server|Gateway|Proxy|Facade|Singleton|Prototype|State|Strategy|Observer|Listener|Publisher|Subscriber|Producer|Consumer|Task|Job)$',
    ],
  },
};

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
      // Arrays extend (don't replace)
      result[key] = [...defaults[key], ...user[key]];
    } else if (
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key]) &&
      typeof user[key] === 'object' &&
      user[key] !== null &&
      !Array.isArray(user[key])
    ) {
      // Nested objects merge recursively (e.g. publicDesignRules)
      result[key] = { ...defaults[key], ...user[key] };
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

'use strict';

const fs = require('fs');
const path = require('path');

const CHINESE_PATTERN = /[\u4e00-\u9fff]/;
const ENGLISH_PATTERN = /[a-zA-Z]/;

function detectLanguage(text) {
  const chineseMatches = (text.match(CHINESE_PATTERN) || []).length;
  const englishMatches = (text.match(ENGLISH_PATTERN) || []).length;

  if (chineseMatches === 0 && englishMatches === 0) {
    return 'unknown';
  }

  const total = chineseMatches + englishMatches;
  const chineseRatio = chineseMatches / total;

  if (chineseRatio > 0.3) {
    return 'zh';
  }
  return 'en';
}

const REQUIRED_DOCS = [
  'docs/SPEC.md',
  'docs/ARCHITECTURE.md',
  'docs/PLAN.md',
  'AGENTS.md',
];

async function checkLanguageConsistency(root, config) {
  const languages = new Map();
  const issues = [];

  for (const relPath of REQUIRED_DOCS) {
    const fullPath = path.join(root, relPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lang = detectLanguage(content);
      if (lang !== 'unknown') {
        languages.set(relPath, lang);
      }
    } catch (err) {
      issues.push(`Failed to read ${relPath}: ${err.message}`);
    }
  }

  const modulesDir = path.join(root, 'docs/modules');
  if (fs.existsSync(modulesDir)) {
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!new RegExp(config.moduleDirPattern).test(entry.name)) continue;

      for (const file of ['INTERFACE.md', 'INTERNALS.md']) {
        const fullPath = path.join(modulesDir, entry.name, file);
        if (!fs.existsSync(fullPath)) continue;

        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lang = detectLanguage(content);
          if (lang !== 'unknown') {
            languages.set(`docs/modules/${entry.name}/${file}`, lang);
          }
        } catch (err) {
          issues.push(`Failed to read ${entry.name}/${file}: ${err.message}`);
        }
      }
    }
  }

  if (languages.size === 0) {
    return {
      name: 'LANGUAGE_CONSISTENCY',
      status: 'skip',
      messages: ['No documents found to check language'],
    };
  }

  const langCounts = new Map();
  for (const [file, lang] of languages) {
    langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
  }

  if (langCounts.size > 1) {
    const details = Array.from(langCounts.entries())
      .map(([lang, count]) => `${lang}: ${count} files`)
      .join(', ');
    issues.push(`Mixed languages detected: ${details}`);

    for (const [file, lang] of languages) {
      issues.push(`  ${file}: ${lang}`);
    }
  }

  if (issues.length === 0) {
    const primaryLang = Array.from(langCounts.keys())[0];
    return {
      name: 'LANGUAGE_CONSISTENCY',
      status: 'pass',
      messages: [`All ${languages.size} documents use consistent language: ${primaryLang}`],
    };
  }

  return {
    name: 'LANGUAGE_CONSISTENCY',
    status: 'fail',
    messages: issues,
  };
}

module.exports = async function check(root, config) {
  return checkLanguageConsistency(root, config);
};
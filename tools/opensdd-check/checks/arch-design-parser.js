'use strict';

function extractPublicDesign(content) {
  const lines = content.split('\n');
  const sections = {};
  let currentSection = null;
  let inCodeBlock = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const headingMatch = trimmed.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim().toLowerCase();
      sections[currentSection] = [];
      continue;
    }

    if (currentSection && trimmed) {
      sections[currentSection].push(trimmed);
    }
  }

  const namingKeywords = [];
  let errorFormat = null;

  for (const [heading, bodyLines] of Object.entries(sections)) {
    const body = bodyLines.join(' ');

    if (
      /全局编码规范|global coding|coding convention|naming/.test(heading) ||
      /命名风格|naming|camelCase|snake_case|PascalCase/.test(body)
    ) {
      if (/camelCase/i.test(body)) namingKeywords.push('camelCase');
      if (/snake_case/i.test(body)) namingKeywords.push('snake_case');
      if (/PascalCase/i.test(body)) namingKeywords.push('PascalCase');
      if (/kebab-case/i.test(body)) namingKeywords.push('kebab-case');
      if (namingKeywords.length === 0) namingKeywords.push('camelCase');
    }

    if (/公共设计|public design|common design/.test(heading) || /错误|error|Error Envelope/.test(body)) {
      const envMatch = body.match(/Error\s*Envelope|error\s*format|错误.*格式/);
      if (envMatch) errorFormat = envMatch[0];
    }
  }

  return { namingConvention: namingKeywords[0] || null, namingKeywords, errorFormat };
}

module.exports = { extractPublicDesign };

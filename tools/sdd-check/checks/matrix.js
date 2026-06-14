const fs = require('fs');
const path = require('path');

// Parse markdown table after "模块依赖矩阵" heading
// Expected table:
//   | 模块 | 依赖 | 所需接口 |
//   |------|------|---------|
//   | api-gateway | auth-core | POST /auth/verify |
function parseDependencyMatrix(content) {
  const lines = content.split('\n');
  const modules = [];
  let inMatrix = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    // detect heading (Chinese or English)
    if (/^#{1,6}\s*(模块依赖矩阵|模块依赖|module dep|dependency matrix)/i.test(trimmed)) {
      inMatrix = true;
      continue;
    }

    if (!inMatrix) continue;

    // skip separator rows (|----|----|---|)
    if (/^\|[\s\-:]+\|/.test(trimmed)) continue;

    // detect table row: | cell | cell | cell |
    const rowMatch = trimmed.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (rowMatch) {
      // skip header row
      const header = rowMatch[1].toLowerCase();
      if (header === '模块' || header === 'module') continue;

      modules.push({
        name: rowMatch[1].trim(),
        depends: rowMatch[2].trim(),
        interface: rowMatch[3].trim(),
      });
      continue;
    }

    // if we hit another heading or empty line after being in matrix, stop scanning
    if (/^#{1,6}\s/.test(trimmed) || trimmed === '') {
      // but don't stop if we haven't found any rows yet
      if (modules.length > 0) break;
    }
  }

  return modules;
}

module.exports = async function check(root) {
  const archPath = path.join(root, 'docs/ARCHITECTURE.md');

  if (!fs.existsSync(archPath)) {
    return { name: 'DEP_MATRIX', status: 'skip', messages: ['docs/ARCHITECTURE.md not found, skipping'] };
  }

  const content = fs.readFileSync(archPath, 'utf-8');
  const modules = parseDependencyMatrix(content);

  if (modules.length === 0) {
    return { name: 'DEP_MATRIX', status: 'warn', messages: ['No dependency matrix table found in ARCHITECTURE.md'] };
  }

  const missing = [];
  for (const m of modules) {
    const dirPath = path.join(root, 'docs/modules', m.name);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      missing.push(m.name);
    }
  }

  if (missing.length === 0) {
    return {
      name: 'DEP_MATRIX',
      status: 'pass',
      messages: [`${modules.length} modules in matrix, all have docs/modules/ directories`],
    };
  }

  return {
    name: 'DEP_MATRIX',
    status: 'warn',
    messages: [missing.map(m => `Module '${m}' declared in dependency matrix but missing from docs/modules/`).join('\n')],
  };
};

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('public-design-compliance', () => {
  const check = require('../checks/public-design-compliance');
  const DEFAULT_CONFIG = require('../config').DEFAULT_CONFIG;

  describe('extractPublicDesign', () => {
    it('should extract naming convention from ARCHITECTURE.md', () => {
      const content = [
        '# Architecture',
        '',
        '## 全局编码规范',
        '命名风格：使用 camelCase 命名。',
        '',
        '## 公共设计',
        '错误返回格式：Error Envelope。',
      ].join('\n');
      const design = check.extractPublicDesign(content);
      assert.strictEqual(design.namingConvention, 'camelCase');
      assert.ok(design.namingKeywords.includes('camelCase'));
    });

    it('should detect snake_case naming', () => {
      const content = ['# Architecture', '', '## Global Coding Convention', 'Use snake_case for all identifiers.'].join(
        '\n',
      );
      const design = check.extractPublicDesign(content);
      assert.strictEqual(design.namingConvention, 'snake_case');
    });

    it('should return nulls when no public design sections exist', () => {
      const content = '# Just a heading\n\nSome text.';
      const design = check.extractPublicDesign(content);
      assert.strictEqual(design.namingConvention, null);
      assert.strictEqual(design.errorFormat, null);
    });

    it('should extract error format from public design', () => {
      const content = ['# Architecture', '', '## 公共设计', '所有接口统一使用 Error Envelope 格式返回错误。'].join(
        '\n',
      );
      const design = check.extractPublicDesign(content);
      assert.ok(design.errorFormat);
      assert.ok(design.errorFormat.includes('Error'));
    });
  });

  describe('extractIdentifiers', () => {
    it('should extract camelCase identifiers', () => {
      const content = '- userId\n- createdAt\n- isActive';
      const ids = check.extractIdentifiers(content);
      assert.ok(ids.camelCase.includes('userId'));
      assert.ok(ids.camelCase.includes('createdAt'));
      assert.ok(ids.camelCase.includes('isActive'));
    });

    it('should extract snake_case identifiers', () => {
      const content = '- user_id\n- created_at\n- is_active';
      const ids = check.extractIdentifiers(content);
      assert.ok(ids.snakeCase.includes('user_id'));
      assert.ok(ids.snakeCase.includes('created_at'));
      assert.ok(ids.snakeCase.includes('is_active'));
    });

    it('should extract PascalCase identifiers', () => {
      const content = '- class UserController\n- UserService\n- LoginRequest';
      const ids = check.extractIdentifiers(content);
      assert.ok(ids.pascalCase.includes('UserController'));
      assert.ok(ids.pascalCase.includes('UserService'));
      assert.ok(ids.pascalCase.includes('LoginRequest'));
    });

    it('should skip code blocks', () => {
      const content = ['Some text.', '```javascript', 'var snake_case_var = 1;', '```', '- camelCaseVar'].join('\n');
      const ids = check.extractIdentifiers(content);
      assert.ok(!ids.snakeCase.includes('snake_case_var'), 'should not detect tokens inside code blocks');
      assert.ok(ids.camelCase.includes('camelCaseVar'));
    });

    it('should return empty when no identifiers', () => {
      const ids = check.extractIdentifiers('# Just a heading');
      assert.strictEqual(ids.camelCase.length, 0);
      assert.strictEqual(ids.snakeCase.length, 0);
      assert.strictEqual(ids.pascalCase.length, 0);
    });
  });

  describe('full check', () => {
    /** @type {string} */
    let tmpDir;

    before(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-pdc-'));
      const docsDir = path.join(tmpDir, 'docs');
      const modulesDir = path.join(docsDir, 'modules', '01-auth');
      fs.mkdirSync(modulesDir, { recursive: true });

      fs.writeFileSync(
        path.join(docsDir, 'ARCHITECTURE.md'),
        [
          '# Architecture',
          '',
          '## 全局编码规范',
          '命名风格：使用 camelCase。',
          '',
          '## 模块引用表',
          '| 编号 | 模块名 | 功能简述 | 详细设计 |',
          '|------|--------|----------|----------|',
          '| 01 | auth | 用户认证 | docs/modules/01-auth/ |',
          '',
          '## 公共设计',
          '错误返回格式：Error Envelope。',
        ].join('\n'),
        'utf-8',
      );

      fs.writeFileSync(
        path.join(modulesDir, 'API.md'),
        [
          '# 01-auth 接口',
          '',
          '## 核心数据结构',
          '- userId: string',
          '- createdAt: Date',
          '- isActive: boolean',
          '',
          '## 接口定义',
          '- POST /auth/register',
        ].join('\n'),
        'utf-8',
      );

      fs.writeFileSync(
        path.join(modulesDir, 'DESIGN.md'),
        ['# 01-auth 内部', '', '## 功能特性列表', '### 01-F001: 注册', '实现用户注册。'].join('\n'),
        'utf-8',
      );
    });

    after(() => {
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should pass when all identifiers follow naming convention', async () => {
      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'pass');
    });

    it('should fail when identifiers violate naming convention', async () => {
      const modulesDir = path.join(tmpDir, 'docs/modules/01-auth');
      fs.writeFileSync(
        path.join(modulesDir, 'API.md'),
        ['# 01-auth 接口', '', '## 核心数据结构', '- user_id: string', '- created_at: Date'].join('\n'),
        'utf-8',
      );

      const result = await check(tmpDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'fail');
      assert.ok(result.messages.some((m) => m.includes('user_id')));
      assert.ok(result.messages.some((m) => m.includes('created_at')));

      // Restore
      fs.writeFileSync(
        path.join(modulesDir, 'API.md'),
        [
          '# 01-auth 接口',
          '',
          '## 核心数据结构',
          '- userId: string',
          '- createdAt: Date',
          '- isActive: boolean',
          '',
          '## 接口定义',
          '- POST /auth/register',
        ].join('\n'),
        'utf-8',
      );
    });

    it('should skip when no ARCHITECTURE.md', async () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-pdc-empty-'));
      const result = await check(emptyDir, DEFAULT_CONFIG);
      assert.strictEqual(result.status, 'skip');
      fs.rmSync(emptyDir, { recursive: true, force: true });
    });

    it('should respect allowedPatterns from config', async () => {
      const configWithAllow = {
        ...DEFAULT_CONFIG,
        publicDesignRules: {
          namingConvention: 'camelCase',
          allowedPatterns: ['^[a-z]+(_[a-z]+)+$'],
        },
      };
      const modulesDir = path.join(tmpDir, 'docs/modules/01-auth');
      fs.writeFileSync(
        path.join(modulesDir, 'API.md'),
        ['# 01-auth 接口', '', '## 核心数据结构', '- user_id: string', '- camelCaseVar: number'].join('\n'),
        'utf-8',
      );

      const result = await check(tmpDir, configWithAllow);
      assert.strictEqual(result.status, 'pass');

      // Restore
      fs.writeFileSync(
        path.join(modulesDir, 'API.md'),
        [
          '# 01-auth 接口',
          '',
          '## 核心数据结构',
          '- userId: string',
          '- createdAt: Date',
          '- isActive: boolean',
          '',
          '## 接口定义',
          '- POST /auth/register',
        ].join('\n'),
        'utf-8',
      );
    });
  });
});

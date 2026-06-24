'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

// ─── HTTP Strategy ───────────────────────────────────────────────────────────

describe('http strategy', () => {
  const http = require('../checks/strategies/http');

  it('should extract METHOD /path endpoints', () => {
    const content = [
      '# API',
      '',
      '## 接口定义',
      '- POST /auth/register',
      '- POST /auth/login',
      '- GET /users/:id',
      '- PUT /users/:id',
      '- DELETE /users/:id',
      '- PATCH /users/:id',
    ].join('\n');
    const defs = http.extract(content);
    assert.strictEqual(defs.length, 6);
    assert.strictEqual(defs[0].type, 'http');
    assert.strictEqual(defs[0].signature, 'POST /auth/register');
    assert.strictEqual(defs[0].details.method, 'POST');
    assert.strictEqual(defs[0].details.path, '/auth/register');
  });

  it('should extract endpoints from markdown table cells', () => {
    const content = '| POST /auth/verify | Verify token |';
    const defs = http.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].details.method, 'POST');
    assert.strictEqual(defs[0].details.path, '/auth/verify');
  });

  it('should extract endpoints inside backticks', () => {
    const content = 'Use `POST /auth/login` to authenticate.';
    const defs = http.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].signature, 'POST /auth/login');
  });

  it('should return empty array for content without endpoints', () => {
    const content = '# Just a heading\n\nSome plain text.';
    assert.strictEqual(http.extract(content).length, 0);
  });

  it('should match required interface against definitions', () => {
    const defs = http.extract('POST /auth/login\nGET /users');
    assert.strictEqual(http.matchRequired('POST /auth/login', defs), true);
    assert.strictEqual(http.matchRequired('GET /users', defs), true);
    assert.strictEqual(http.matchRequired('DELETE /users', defs), false);
  });

  it('should extract HEAD, OPTIONS, CONNECT methods', () => {
    const content = [
      '- HEAD /resource/1',
      '- OPTIONS /api',
      '- CONNECT /proxy',
      '- PATCH /resource/1',
      '- GET /resource/1',
    ].join('\n');
    const defs = http.extract(content);
    assert.strictEqual(defs.length, 5);
    assert.strictEqual(defs[0].details.method, 'HEAD');
    assert.strictEqual(defs[1].details.method, 'OPTIONS');
    assert.strictEqual(defs[2].details.method, 'CONNECT');
    assert.strictEqual(defs[3].details.method, 'PATCH');
    assert.strictEqual(defs[4].details.method, 'GET');
  });

  it('should match HEAD, OPTIONS, CONNECT required interfaces', () => {
    const defs = http.extract('HEAD /health\nOPTIONS /api\nCONNECT /proxy');
    assert.strictEqual(http.matchRequired('HEAD /health', defs), true);
    assert.strictEqual(http.matchRequired('OPTIONS /api', defs), true);
    assert.strictEqual(http.matchRequired('CONNECT /proxy', defs), true);
  });

  it('should return false for non-HTTP required string', () => {
    assert.strictEqual(http.matchRequired('someFunction', []), false);
  });
});

// ─── gRPC Strategy ──────────────────────────────────────────────────────────

describe('grpc strategy', () => {
  const grpc = require('../checks/strategies/grpc');

  it('should extract rpc method definitions', () => {
    const content = [
      'service AuthService {',
      '  rpc Login(LoginRequest) returns (LoginResponse);',
      '  rpc Logout(LogoutRequest) returns (Empty);',
      '}',
    ].join('\n');
    const defs = grpc.extract(content);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].type, 'grpc');
    assert.strictEqual(defs[0].details.method, 'Login');
    assert.strictEqual(defs[0].details.service, 'AuthService');
    assert.strictEqual(defs[0].details.fullName, 'AuthService.Login');
    assert.strictEqual(defs[0].details.requestType, 'LoginRequest');
    assert.strictEqual(defs[0].details.responseType, 'LoginResponse');
  });

  it('should extract rpc methods without service block', () => {
    const content = 'rpc ValidateToken(TokenRequest) returns (TokenResponse)';
    const defs = grpc.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].details.service, null);
    assert.strictEqual(defs[0].details.fullName, 'ValidateToken');
  });

  it('should handle stream rpc definitions', () => {
    const content = 'rpc Subscribe(SubscribeRequest) returns (stream Event)';
    const defs = grpc.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].details.responseType, 'stream Event');
  });

  it('should return empty array for content without rpc definitions', () => {
    assert.strictEqual(grpc.extract('# Just a heading').length, 0);
  });

  it('should match qualified service.method reference', () => {
    const defs = grpc.extract('service Auth { rpc Login(Req) returns (Res); }');
    assert.strictEqual(grpc.matchRequired('Auth.Login', defs), true);
    assert.strictEqual(grpc.matchRequired('Auth.Logout', defs), false);
  });

  it('should match unqualified method name', () => {
    const defs = grpc.extract('rpc Login(Req) returns (Res)');
    assert.strictEqual(grpc.matchRequired('Login', defs), true);
    assert.strictEqual(grpc.matchRequired('Logout', defs), false);
  });

  it('should match full rpc signature', () => {
    const defs = grpc.extract('rpc Login(LoginRequest) returns (LoginResponse)');
    assert.strictEqual(grpc.matchRequired('rpc Login(LoginRequest) returns (LoginResponse)', defs), true);
    assert.strictEqual(grpc.matchRequired('rpc Login(LoginRequest) returns (Empty)', defs), false);
  });

  it('should match full rpc signature with stream', () => {
    const defs = grpc.extract('rpc Subscribe(SubscribeRequest) returns (stream Event)');
    assert.strictEqual(grpc.matchRequired('rpc Subscribe(SubscribeRequest) returns (stream Event)', defs), true);
    assert.strictEqual(grpc.matchRequired('rpc Subscribe(SubscribeRequest) returns (Event)', defs), false);
  });
});

// ─── Function Strategy ───────────────────────────────────────────────────────

describe('function strategy', () => {
  const fnStrategy = require('../checks/strategies/function');

  it('should extract functions with return type', () => {
    const content = [
      '## 接口定义',
      '- validateToken(token: string): Claims',
      '- generateJwt(userId: number): string',
    ].join('\n');
    const defs = fnStrategy.extract(content);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].type, 'function');
    assert.strictEqual(defs[0].details.name, 'validateToken');
    assert.strictEqual(defs[0].details.params.length, 1);
    assert.strictEqual(defs[0].details.returnType, 'Claims');
    assert.strictEqual(defs[0].signature, 'validateToken(token: string): Claims');
  });

  it('should extract bare function names from list items', () => {
    const content = ['## 接口列表', '- validateToken', '- generateJwt'].join('\n');
    const defs = fnStrategy.extract(content);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].details.name, 'validateToken');
    assert.strictEqual(defs[0].details.params.length, 0);
    assert.strictEqual(defs[0].details.returnType, null);
  });

  it('should extract functions with params but no return type', () => {
    const content = 'validateToken(token, user)';
    const defs = fnStrategy.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].details.name, 'validateToken');
    assert.strictEqual(defs[0].details.params.length, 2);
    assert.strictEqual(defs[0].details.returnType, null);
    assert.strictEqual(defs[0].signature, 'validateToken(token, user)');
  });

  it('should handle arrow/colon return syntax', () => {
    const content = 'hashPassword(password: string) => string';
    const defs = fnStrategy.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].details.returnType, 'string');
  });

  it('should return empty array for content without functions', () => {
    assert.strictEqual(fnStrategy.extract('# Just a heading').length, 0);
  });

  it('should match by full signature (name + params + return)', () => {
    const defs = fnStrategy.extract('validateToken(token: string): Claims');
    assert.strictEqual(fnStrategy.matchRequired('validateToken(token: string): Claims', defs), true);
    assert.strictEqual(fnStrategy.matchRequired('validateToken(token: string): User', defs), false);
  });

  it('should match by name + params (no return)', () => {
    const defs = fnStrategy.extract('validateToken(token, user)');
    assert.strictEqual(fnStrategy.matchRequired('validateToken(token, user)', defs), true);
    assert.strictEqual(fnStrategy.matchRequired('validateToken(token)', defs), false);
  });

  it('should match by bare name', () => {
    const defs = fnStrategy.extract('- validateToken');
    assert.strictEqual(fnStrategy.matchRequired('validateToken', defs), true);
    assert.strictEqual(fnStrategy.matchRequired('generateJwt', defs), false);
  });

  it('should handle function with generic type parameters', () => {
    const content = 'mapToList<T>(items: T[]): List<T>';
    const defs = fnStrategy.extract(content);
    assert.strictEqual(defs.length, 1);
    assert.strictEqual(defs[0].details.name, 'mapToList');
    assert.strictEqual(defs[0].details.params.length, 1);
    assert.strictEqual(defs[0].details.returnType, 'List<T>');
    assert.strictEqual(defs[0].signature, 'mapToList(items: T[]): List<T>');
  });

  it('should match signature with generic type parameters', () => {
    const defs = fnStrategy.extract('mapToList<T>(items: T[]): List<T>');
    assert.strictEqual(fnStrategy.matchRequired('mapToList(items: T[]): List<T>', defs), true);
  });
});

// ─── Strategy Registry ──────────────────────────────────────────────────────

describe('strategy registry', () => {
  const { getStrategy, detect, STRATEGIES } = require('../checks/strategies');

  it('should expose all three strategies', () => {
    assert.ok(STRATEGIES.http);
    assert.ok(STRATEGIES.grpc);
    assert.ok(STRATEGIES.function);
    assert.strictEqual(STRATEGIES.http.name, 'http');
    assert.strictEqual(STRATEGIES.grpc.name, 'grpc');
    assert.strictEqual(STRATEGIES.function.name, 'function');
  });

  it('should get strategy by name', () => {
    const http = getStrategy('http');
    assert.strictEqual(http.name, 'http');
    const grpc = getStrategy('grpc');
    assert.strictEqual(grpc.name, 'grpc');
  });

  it('should fallback to http for unknown strategy', () => {
    const s = getStrategy('unknown');
    assert.strictEqual(s.name, 'http');
  });

  it('should auto-detect http strategy from HTTP content', () => {
    const result = detect(['POST /auth/register\nGET /users', 'PUT /users/:id\nDELETE /users/:id']);
    assert.strictEqual(result.name, 'http');
  });

  it('should auto-detect grpc strategy from gRPC content', () => {
    const result = detect(['service Auth { rpc Login(Req) returns (Res); }', 'rpc Logout(Empty) returns (Empty);']);
    assert.strictEqual(result.name, 'grpc');
  });

  it('should auto-detect function strategy from function content', () => {
    const result = detect(['- validateToken(token: string): Claims', '- generateJwt(user: User): string']);
    assert.strictEqual(result.name, 'function');
  });

  it('should fallback to http when all contents are empty', () => {
    const result = detect([]);
    assert.strictEqual(result.name, 'http (fallback)');
  });
});

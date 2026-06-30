import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fixConsola } from '../../../scripts/fix-consola-esm';

/** 垫片文件期望包含的重导出语句 */
const EXPECTED_SHIM_EXPORTS = "export * from './dist/index.mjs'";
const EXPECTED_SHIM_DEFAULT = "export { default } from './dist/index.mjs'";

describe('fix-consola-esm', () => {
  let tempDir: string;

  beforeEach(async () => {
    // 每个测试用例使用独立的临时目录，互不干扰
    tempDir = await mkdtemp(join(tmpdir(), 'fix-consola-esm-'));
  });

  afterEach(async () => {
    // 清理临时目录
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('fixConsola()', () => {
    test('目标目录无 index.js 且 package.json 合法时，写入垫片并返回 true', () => {
      const consolaDir = join(tempDir, 'consola');
      mkdirSync(consolaDir);
      writeFileSync(
        join(consolaDir, 'package.json'),
        JSON.stringify({ name: 'consola', version: '3.4.2', type: 'module' }),
      );

      const result = fixConsola(consolaDir);

      expect(result).toBe(true);

      // 验证垫片文件已创建且内容正确
      const shim = readFileSync(join(consolaDir, 'index.js'), 'utf-8');
      expect(shim).toContain(EXPECTED_SHIM_EXPORTS);
      expect(shim).toContain(EXPECTED_SHIM_DEFAULT);
    });

    test('垫片已存在时跳过写入，返回 false（幂等）', () => {
      const consolaDir = join(tempDir, 'consola');
      mkdirSync(consolaDir);
      writeFileSync(
        join(consolaDir, 'package.json'),
        JSON.stringify({ name: 'consola', version: '3.4.2' }),
      );

      // 先写入一个已有的 index.js
      const existingContent = '// already exists';
      writeFileSync(join(consolaDir, 'index.js'), existingContent);

      const result = fixConsola(consolaDir);

      expect(result).toBe(false);

      // 确认原有内容未被覆盖
      const content = readFileSync(join(consolaDir, 'index.js'), 'utf-8');
      expect(content).toBe(existingContent);
    });

    test('连续调用两次，第二次返回 false（幂等验证）', () => {
      const consolaDir = join(tempDir, 'consola');
      mkdirSync(consolaDir);
      writeFileSync(
        join(consolaDir, 'package.json'),
        JSON.stringify({ name: 'consola', version: '3.4.2' }),
      );

      expect(fixConsola(consolaDir)).toBe(true);
      expect(fixConsola(consolaDir)).toBe(false);
    });

    test('目标目录无 package.json 时返回 false', () => {
      const consolaDir = join(tempDir, 'consola');
      mkdirSync(consolaDir);
      // 不写入 package.json

      const result = fixConsola(consolaDir);

      expect(result).toBe(false);
      // 不应创建 index.js
      expect(existsSync(join(consolaDir, 'index.js'))).toBe(false);
    });

    test('package.json 的 name 不是 consola 时返回 false（防止误操作其他包）', () => {
      const consolaDir = join(tempDir, 'not-consola');
      mkdirSync(consolaDir);
      writeFileSync(
        join(consolaDir, 'package.json'),
        JSON.stringify({ name: 'other-package', version: '1.0.0' }),
      );

      const result = fixConsola(consolaDir);

      expect(result).toBe(false);
      expect(existsSync(join(consolaDir, 'index.js'))).toBe(false);
    });

    test('package.json 内容不是合法 JSON 时返回 false', () => {
      const consolaDir = join(tempDir, 'consola');
      mkdirSync(consolaDir);
      writeFileSync(join(consolaDir, 'package.json'), '{ invalid json }}}');

      const result = fixConsola(consolaDir);

      expect(result).toBe(false);
    });

    test('目标目录本身不存在时返回 false', () => {
      const consolaDir = join(tempDir, 'nonexistent', 'consola');

      const result = fixConsola(consolaDir);

      expect(result).toBe(false);
    });

    test('垫片内容包含正确的 ESM 重导出语法', () => {
      const consolaDir = join(tempDir, 'consola');
      mkdirSync(consolaDir);
      writeFileSync(
        join(consolaDir, 'package.json'),
        JSON.stringify({ name: 'consola', version: '3.4.2', type: 'module' }),
      );

      fixConsola(consolaDir);

      const shim = readFileSync(join(consolaDir, 'index.js'), 'utf-8');

      // 必须同时包含命名空间重导出和默认导出重导出
      expect(shim).toContain("export * from './dist/index.mjs'");
      expect(shim).toContain("export { default } from './dist/index.mjs'");
      // 应包含自动生成标记，便于识别来源
      expect(shim).toContain('Auto-generated');
    });
  });
});

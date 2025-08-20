# Release Toolkit Tests

本目录包含 `@ruan-cat/release-toolkit` 的测试文件。

## 测试文件

- `emoji-commit-parsing.test.ts` - emoji 提交消息解析功能的测试
- `run-tests.ts` - 测试运行器，执行所有测试

## 运行测试

### 开发环境（直接运行 TypeScript）

```bash
# 在 release-toolkit 目录下
pnpm test

# 或者直接运行
pnpm exec tsx src/tests/run-tests.ts
```

### 生产环境（构建后运行）

```bash
# 构建并运行测试
pnpm test:build

# 或者分步执行
pnpm build
node dist/tests/run-tests.js
```

## 测试内容

### Emoji Commit Parsing Tests

测试 changelogen 的 emoji commit 解析功能，验证以下格式：

1. **Gitmoji 代码格式**: `:sparkles: feat(auth): 新增用户认证功能`
2. **Unicode emoji 格式**: `✨ feat(auth): 新增用户认证功能`
3. **带作用域**: `🐞 fix(api): 修复数据获取错误`
4. **标准格式**: `feat(api): 新增数据导出功能`
5. **Breaking changes**: `🔥 feat!: remove deprecated API`
6. **Pull Request 引用**: `✨ feat(auth): add OAuth support (#123)`

### 测试用例统计

- **Emoji parsing**: 7 个测试用例
- **Invalid messages**: 3 个测试用例  
- **Breaking changes**: 1 个测试用例
- **PR references**: 1 个测试用例
- **Supported formats**: 4 个测试用例

**总计**: 16 个测试用例

## 添加新测试

要添加新的测试功能：

1. 在相应的 `.test.ts` 文件中添加测试函数
2. 在 `runAllTests()` 函数中调用新的测试
3. 更新 `run-tests.ts` 如果需要新的测试入口
4. 运行测试确保一切正常

## 注意事项

- 测试文件使用自定义的简单断言函数，不依赖外部测试框架
- 所有测试输出都会在控制台显示，便于调试
- 测试失败会返回非零退出码，适合 CI/CD 集成
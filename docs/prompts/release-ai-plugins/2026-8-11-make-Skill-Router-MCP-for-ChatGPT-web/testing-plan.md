# 测试方案

## 单元测试

覆盖：

- skill parser
- registry loader
- metadata validator
- MCP response builder

## 协议测试

验证：

- initialize
- tools/list
- tools/call

## 集成测试

模拟 ChatGPT MCP Client：

1. 查询技能。
2. 加载技能。
3. 验证上下文完整性。

## 部署测试

验证：

- Worker 部署
- 自定义域名
- TLS
- KV 读取
- 高并发请求。
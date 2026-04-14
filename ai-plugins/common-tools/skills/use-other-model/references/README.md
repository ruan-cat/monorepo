# References 目录

本目录承载 `use-other-model` 技能的渐进式加载文档。

升级后的主线已经从“旧的代码模板集合”切换为四类核心文档,但这并不意味着旧文档的解释价值被抹掉。  
这里仍然保留“按主题找文档”的导航方式,只是把启动模板、任务封包、浏览器验收和失败分流提到了更前面。

## 文件说明

### 新主线文档

方案 B 现在优先围绕下面四类文档展开:

1. **启动模板**
2. **任务封包模板**
3. **前端浏览器验收模板**
4. **失败分流文档**

### 核心实现文档

- **`method-a-mcp-tools.md`**
  - 方案 A 的说明
  - 适合简单任务和单次调用

- **`method-b-independent-session.md`**
  - 方案 B 的执行契约
  - 说明为什么它是独立编码代理,不是普通问答会话
  - 包含职责分层图、关键技术点、标准工作流和回退边界

- **`claude-code-launch-templates.md`**
  - Bash / PowerShell 的标准启动模板
  - 基于本机 `claude --help` 核实参数
  - 默认使用 `--permission-mode bypassPermissions`、`--tools default`、`--output-format json`

- **`context-packet-template.md`**
  - 任务封包模板
  - 规定工作目录、分支、先读文件、允许修改范围、禁止事项、验证命令、完成规则

- **`frontend-browser-verification-template.md`**
  - 前端任务专用浏览器验收模板
  - 强制要求 URL、视觉目标、关键交互、执行日志

- **`failure-routing.md`**
  - 启动失败、执行失败、浏览器验收失败的处理流程
  - 包含“连续两轮失败后主代理接管”的硬规则

### 配置与辅助文档

- **`environment-variables.md`**
  - provider 环境变量格式识别与提取
  - 仍然保留用户常见输入格式示例,方便主代理做变量提取和转换

- **`case-study-git-commits.md`**
  - 方案 B 的实战案例
  - 保留了完整计划和启动脚本示例,适合快速理解“主会话编排 + 子会话执行”是什么样子

- **`faq.md`**
  - 常见问题和回退建议

- **`code-templates.md`**
  - 兼容保留的旧模板入口
  - 新流程应优先使用 `claude-code-launch-templates.md` 和 `context-packet-template.md`
  - 但仍保留“可以直接抄”的模板骨架,方便快速落地

## 阅读顺序建议

### 首次使用方案 B

1. 先读 `method-b-independent-session.md`
   - 先理解谁负责什么、为什么要这么分层
2. 再读 `claude-code-launch-templates.md`
   - 再拿到可直接运行的启动模板
3. 然后读 `context-packet-template.md`
   - 再补完整任务封包
4. 如果是前端任务,再读 `frontend-browser-verification-template.md`
5. 最后看 `failure-routing.md`
   - 明确失败后的分流和停止条件

### 需要排错时

1. 先看 `failure-routing.md`
2. 再看 `faq.md`
3. 若怀疑是 provider 配置问题,查看 `environment-variables.md`

### 需要快速复用时

1. 直接复制 `claude-code-launch-templates.md` 中的启动模板
2. 填写 `context-packet-template.md`
3. 前端任务附加 `frontend-browser-verification-template.md`
4. 如果想先看完整示例,可回看 `case-study-git-commits.md`

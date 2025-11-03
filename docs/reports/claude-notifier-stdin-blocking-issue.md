# @ruan-cat/claude-notifier stdin 阻塞导致进程挂起问题分析报告

## 报告信息

- **日期**: 2025-11-03
- **问题**: check-and-notify 命令导致大量 npx 进程无法退出
- **影响范围**: 所有通过 Claude Code hooks 调用 `pnpm dlx @ruan-cat/claude-notifier check-and-notify` 的场景
- **状态**: ✅ 已修复

---

## 问题描述

### 症状表现

在 Windows 系统上，使用 `@ruan-cat/claude-notifier` 包并通过 Claude Code hooks 高频调用 `check-and-notify` 命令后，系统出现大量未关闭的 `npx.exe` 进程：

![2025-11-03-22-36-12](https://s2.loli.net/2025/11/03/aZN7IuxryEofFnY.png)

**具体表现：**

1. 任务管理器中显示几十个甚至上百个 `npx.exe` 进程
2. 这些进程处于运行状态但实际已挂起，不消耗 CPU 但占用内存
3. 进程无法自动退出，需要手动结束
4. 随着使用时间增长，进程数量持续累积

### 影响范围

- **影响用户**: 所有在 Windows 系统上使用该包的用户
- **触发场景**:
  - 在 `.claude/settings.local.json` 或插件的 `hooks.json` 中配置了 `check-and-notify` 命令
  - 高频触发 Claude Code hooks（UserPromptSubmit、PreToolUse、PostToolUse 等）
- **严重程度**: 高（影响系统性能，占用系统资源）

---

## 根本原因分析

### 代码问题定位

问题出在 `packages/claude-notifier/src/core/timer.ts:285-314` 的 `readHookInput()` 函数：

```typescript
// 问题代码（修复前）
export function readHookInput(): Promise<HookInputData | null> {
	return new Promise((resolve) => {
		let data = "";

		process.stdin.setEncoding("utf-8");

		process.stdin.on("data", (chunk) => {
			data += chunk;
		});

		process.stdin.on("end", () => {
			// 只有当 stdin 关闭时才会触发
			try {
				if (!data.trim()) {
					resolve(null);
					return;
				}
				const parsed = JSON.parse(data) as HookInputData;
				resolve(parsed);
			} catch (error) {
				console.error("解析 stdin JSON 失败:", error);
				resolve(null);
			}
		});

		process.stdin.on("error", (error) => {
			console.error("读取 stdin 失败:", error);
			resolve(null);
		});
	});
}
```

### 技术原因

1. **stdin 事件依赖**:
   - 函数通过监听 `process.stdin.on('end')` 事件来判断输入结束
   - 该事件只有在 stdin 流被正确关闭（收到 EOF）时才会触发

2. **阻塞等待**:
   - 如果调用方没有正确关闭 stdin，或 stdin 处于打开状态
   - Promise 会永久等待 `end` 事件，永远不会 resolve
   - 进程因此无法退出，一直挂起

3. **累积效应**:
   - 每次触发 hook 都会通过 `pnpm dlx` 创建新的 Node.js 进程
   - `pnpm dlx` 内部会调用 `npx` 来执行包
   - 每个挂起的进程都对应一个 `npx.exe`
   - 随着 hooks 的高频触发，进程数量持续增长

### 为什么在 hooks 场景下特别严重

Claude Code hooks 的特点：

- **高频触发**: UserPromptSubmit、PreToolUse、PostToolUse 等事件在正常使用中频繁触发
- **并发执行**: 多个 hooks 可能同时触发，产生多个并发进程
- **stdin 状态不确定**: Claude Code 调用 hook 命令时，stdin 的状态可能不一致
  - 有些事件会通过 stdin 传递 JSON 数据
  - 有些事件不传递数据，stdin 可能处于开放状态

---

## 解决方案

### 修复方案

为 `readHookInput()` 函数添加超时机制，防止无限期等待：

```typescript
// 修复后的代码
export function readHookInput(): Promise<HookInputData | null> {
	return new Promise((resolve) => {
		let data = "";
		let resolved = false;

		// 设置超时时间（500ms）
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true;
				// 清理事件监听器，避免内存泄漏
				process.stdin.removeAllListeners("data");
				process.stdin.removeAllListeners("end");
				process.stdin.removeAllListeners("error");
				resolve(null);
			}
		}, 500);

		process.stdin.setEncoding("utf-8");

		process.stdin.on("data", (chunk) => {
			data += chunk;
		});

		process.stdin.on("end", () => {
			if (!resolved) {
				resolved = true;
				clearTimeout(timeout);
				try {
					if (!data.trim()) {
						resolve(null);
						return;
					}
					const parsed = JSON.parse(data) as HookInputData;
					resolve(parsed);
				} catch (error) {
					console.error("解析 stdin JSON 失败:", error);
					resolve(null);
				}
			}
		});

		process.stdin.on("error", (error) => {
			if (!resolved) {
				resolved = true;
				clearTimeout(timeout);
				console.error("读取 stdin 失败:", error);
				resolve(null);
			}
		});
	});
}
```

### 修复要点

1. **超时保护**:
   - 设置 500ms 超时，如果 stdin 没有数据或未关闭，自动返回 null
   - 避免进程无限期挂起

2. **重复 resolve 保护**:
   - 使用 `resolved` 标志位，确保 Promise 只 resolve 一次
   - 防止在超时和正常 end 事件同时触发时的竞态问题

3. **事件监听器清理**:
   - 超时时主动移除所有 stdin 事件监听器
   - 防止内存泄漏和事件处理器累积

4. **优雅降级**:
   - 超时后返回 null，表示没有接收到 hook 输入数据
   - 程序继续执行后续逻辑（清理过期任务、检查通知等）
   - 不影响核心功能

---

## 临时清理方案

对于已经出现大量挂起进程的用户，可以手动清理：

### Windows 系统

```powershell
# 查看所有 npx 进程
tasklist | findstr npx

# 结束所有 npx 进程（谨慎使用，会结束所有 npx 进程）
taskkill /F /IM npx.exe

# 或者更安全地逐个结束（推荐）
taskkill /F /PID <进程ID>
```

### 验证进程已清理

```powershell
# 确认没有残留的 npx 进程
tasklist | findstr npx
```

---

## 测试验证

### 修复前行为

1. 配置 hook 调用 `check-and-notify`
2. 频繁触发 hooks（例如多次提交 prompt）
3. 打开任务管理器观察进程
4. 结果：每次触发都会产生新的 npx.exe 进程，且不会退出

### 修复后行为

1. 应用修复，重新构建包
2. 相同的 hook 配置和触发场景
3. 观察进程行为
4. 预期结果：
   - 进程在 500ms 后自动退出
   - 不会累积大量 npx 进程
   - 功能正常（能够正常接收和处理 hook 数据）

---

## 版本发布

- **修复版本**: 0.6.1（待发布）
- **发版类型**: patch
- **Changeset**: `.changeset/fix-stdin-blocking-issue.md`

---

## 经验教训

### 1. 异步 I/O 操作必须有超时保护

在 Node.js 中处理 stdin、socket 等 I/O 流时，如果依赖流的关闭事件，必须考虑超时保护：

- stdin 可能不会被正确关闭
- 网络连接可能中断但不触发 end 事件
- 文件读取可能因权限问题挂起

**最佳实践**: 所有等待 I/O 事件的 Promise 都应该有超时机制。

### 2. 清理资源时要彻底

在设置超时退出时，要考虑清理所有注册的事件监听器：

- 防止内存泄漏
- 避免事件触发导致的意外行为
- 确保进程能够正常退出

### 3. 高频调用场景需要特别关注资源管理

像 Claude Code hooks 这样的高频调用场景，即使是小的资源泄漏也会迅速累积：

- 每次调用都要确保资源正确释放
- 进程必须能够正常退出
- 考虑添加资源使用监控

### 4. 跨平台测试的重要性

虽然这是 stdin 阻塞的通用问题，但在 Windows 上表现最为明显：

- Windows 任务管理器中可以直观看到进程累积
- Linux 系统可能因为不同的进程管理机制，表现不那么明显
- 需要在主要目标平台上充分测试

### 5. 文档中应明确说明使用限制

在文档中应该说明：

- 该包目前主要在 Windows 系统上测试
- 适用于 Claude Code hooks 场景
- stdin 输入有 500ms 超时限制

---

## 后续优化建议

### 1. 可配置的超时时间

允许用户通过环境变量或配置文件自定义超时时间：

```typescript
const STDIN_TIMEOUT = parseInt(process.env.CLAUDE_NOTIFIER_STDIN_TIMEOUT || "500");
```

### 2. 添加调试模式

提供详细的日志输出，帮助排查问题：

```typescript
if (process.env.DEBUG === "claude-notifier") {
	console.log("[DEBUG] Waiting for stdin...");
	console.log("[DEBUG] Timeout after 500ms");
}
```

### 3. 进程管理优化

考虑使用其他方式调用命令，避免通过 `pnpm dlx` 创建新进程：

- 直接在 hooks 中使用 Node.js API
- 创建常驻后台服务
- 使用 IPC 通信代替命令行调用

### 4. 监控和告警

添加进程监控，当检测到异常进程累积时主动告警：

- 检测同名进程数量
- 检测进程存活时间
- 提供清理工具

---

## 参考资料

### 相关文件

- `packages/claude-notifier/src/core/timer.ts` - 修复的主要文件
- `packages/claude-notifier/src/commands/check-and-notify.ts` - 调用 readHookInput() 的命令
- `.changeset/fix-stdin-blocking-issue.md` - 变更日志

### Node.js 文档

- [process.stdin](https://nodejs.org/api/process.html#processstdin)
- [stream.Readable](https://nodejs.org/api/stream.html#class-streamreadable)
- [Event: 'end'](https://nodejs.org/api/stream.html#event-end)

### 类似问题

- [Node.js: How to read from stdin with a timeout](https://stackoverflow.com/questions/6157497)
- [stdin blocking in Node.js](https://github.com/nodejs/node/issues)

---

## 附录：完整的修复 diff

```diff
--- a/packages/claude-notifier/src/core/timer.ts
+++ b/packages/claude-notifier/src/core/timer.ts
@@ -280,10 +280,17 @@ export function getAllTaskStates(): Record<string, TaskState> {

 /**
  * 从 stdin 读取 Hook 输入数据
+ *
+ * 添加超时机制防止进程挂起：
+ * - 如果 stdin 在 500ms 内没有数据或未关闭，自动返回 null
+ * - 防止进程永久挂起导致大量未关闭的 npx 进程累积
+ *
  * @returns Promise<HookInputData | null>
  */
 export function readHookInput(): Promise<HookInputData | null> {
   return new Promise((resolve) => {
     let data = "";
+    let resolved = false;
+
+    // 设置超时时间（500ms）
+    const timeout = setTimeout(() => {
+      if (!resolved) {
+        resolved = true;
+        // 清理事件监听器，避免内存泄漏
+        process.stdin.removeAllListeners("data");
+        process.stdin.removeAllListeners("end");
+        process.stdin.removeAllListeners("error");
+        resolve(null);
+      }
+    }, 500);

     process.stdin.setEncoding("utf-8");

@@ -292,6 +299,9 @@ export function readHookInput(): Promise<HookInputData | null> {
     });

     process.stdin.on("end", () => {
+      if (!resolved) {
+        resolved = true;
+        clearTimeout(timeout);
         try {
           if (!data.trim()) {
             resolve(null);
@@ -303,9 +313,13 @@ export function readHookInput(): Promise<HookInputData | null> {
           console.error("解析 stdin JSON 失败:", error);
           resolve(null);
         }
+      }
     });

     process.stdin.on("error", (error) => {
+      if (!resolved) {
+        resolved = true;
+        clearTimeout(timeout);
         console.error("读取 stdin 失败:", error);
         resolve(null);
+      }
     });
   });
 }
```

---

**报告完成日期**: 2025-11-03

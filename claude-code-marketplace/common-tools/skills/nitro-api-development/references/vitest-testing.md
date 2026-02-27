# Nitro 接口测试参考文档

本文档包含 Nitro 接口测试的详细配置和模板，适用于对已运行的 Nitro 开发服务器进行 HTTP 级别的集成测试。

## 1. vitest.config.ts 配置

### 1.1 条件配置

在项目的 `vitest.config.ts` 中，可以使用 `--node` 参数区分前端测试和 Nitro 接口测试：

```typescript
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	// 如果是 node 环境（nitro 接口测试）
	const isNodeTest = process.argv.includes("--node");

	if (isNodeTest) {
		return {
			test: {
				environment: "node",
				include: ["tests/nitro/**/*.test.ts"],
				exclude: [...configDefaults.exclude, "e2e/**", "src/**/*.test.ts"],
				root: fileURLToPath(new URL("./", import.meta.url)),
				env: {
					NODE_ENV: "test",
					...loadEnv("test", process.cwd(), ""),
				},
				globals: true,
				setupFiles: ["./tests/setup-server.ts"],
				pool: "forks",
			},
			resolve: {
				alias: {
					"@": fileURLToPath(new URL("./src", import.meta.url)),
					"setup-server": fileURLToPath(new URL("./tests/setup-server.ts", import.meta.url)),
				},
			},
		};
	}

	// 默认 jsdom 环境（原有前端测试）
	return {
		/* ... 你的前端测试配置 */
	};
});
```

### 1.2 tsconfig.json 配置

在项目的 `tsconfig.json` 中添加路径别名和测试目录：

```json
{
	"compilerOptions": {
		"paths": {
			"setup-server": ["./tests/setup-server.ts"]
		}
	},
	"include": ["tests/**/*.ts"]
}
```

## 2. setup-server.ts 环境配置

### 2.1 文件位置

放在项目的 `tests/setup-server.ts`（根据你的项目结构调整路径）。

### 2.2 完整代码

```typescript
import { config } from "@dotenvx/dotenvx";
import { resolve } from "node:path";

const projectDir = process.cwd();

/**
 * 加载环境变量（用于 Nitro 接口测试）
 * 根据你的项目需要，加载对应的 .env 文件
 */
function loadTestEnv() {
	config({ path: resolve(projectDir, ".env") });
	// 可选：加载其他环境变量文件
	// config({ path: resolve(projectDir, ".env.test") });
	// config({ path: resolve(projectDir, ".env.local") });
}

loadTestEnv();

/** Nitro 开发服务器的端口（根据你的 nitro.config.ts 配置调整） */
const NITRO_PORT = process.env.PORT || process.env.VITE_PORT || "3000";
export const NITRO_BASE_URL = `http://localhost:${NITRO_PORT}`;

/**
 * 便捷的 Nitro API 调用函数
 *
 * @param path - API 路径（如 "/api/users/list"）
 * @param options - fetch 选项
 * @returns fetch Response
 */
export async function fetchNitroApi(path: string, options: RequestInit = {}): Promise<Response> {
	const url = `${NITRO_BASE_URL}${path}`;
	console.log(`📡 调用 Nitro API: ${url}`);

	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	return response;
}

/**
 * 检查 Nitro 服务器是否正在运行
 *
 * @returns 服务器是否可用
 */
export async function checkNitroServer(): Promise<boolean> {
	try {
		const response = await fetch(`${NITRO_BASE_URL}/api/health`, {
			method: "GET",
		});
		return response.ok;
	} catch {
		return false;
	}
}
```

## 3. 测试用例模板

### 3.1 标准模板

```typescript
/**
 * @file {接口描述}
 * @description 测试 {API 路径} 接口
 */

import { test, expect, describe, beforeAll } from "vitest";
import { fetchNitroApi, checkNitroServer, NITRO_BASE_URL } from "setup-server";

describe("{测试套件描述}", () => {
	beforeAll(async () => {
		const isRunning = await checkNitroServer();
		if (!isRunning) {
			console.warn(`⚠️  Nitro 服务器未运行，请先运行 'pnpm dev' 启动服务器`);
			console.warn(`📡 预期服务器地址: ${NITRO_BASE_URL}`);
		}
	});

	test("POST /api/{接口路径} - {测试描述}", async () => {
		const response = await fetchNitroApi("/api/{接口路径}", {
			method: "POST",
			body: JSON.stringify({
				page: 1,
				pageSize: 10,
			}),
		});

		// 验证响应状态
		expect(response.ok).toBe(true);

		// 解析响应数据
		const result = await response.json();

		// 验证响应结构
		expect(result.success).toBe(true);
		expect(result.code).toBe(200);
		expect(result.data).toBeDefined();

		console.log("✅ {测试描述}测试通过");
	});
});
```

### 3.2 完整测试示例

```typescript
/**
 * @file 用户列表接口测试
 * @description 测试 /api/users/list 接口
 */

import { test, expect, describe, beforeAll } from "vitest";
import { fetchNitroApi, checkNitroServer, NITRO_BASE_URL } from "setup-server";

describe("用户列表接口测试", () => {
	beforeAll(async () => {
		const isRunning = await checkNitroServer();
		if (!isRunning) {
			console.warn(`⚠️  Nitro 服务器未运行，请先运行 'pnpm dev' 启动服务器`);
			console.warn(`📡 预期服务器地址: ${NITRO_BASE_URL}`);
		}
	});

	test("POST /api/users/list - 获取用户列表", async () => {
		const response = await fetchNitroApi("/api/users/list", {
			method: "POST",
			body: JSON.stringify({
				page: 1,
				pageSize: 10,
			}),
		});

		expect(response.ok).toBe(true);

		const result = await response.json();
		expect(result.success).toBe(true);
		expect(result.code).toBe(200);
		expect(result.data).toBeDefined();

		console.log("✅ 用户列表接口测试通过");
	});
});
```

## 4. 运行命令

### 4.1 package.json 脚本配置

在 `package.json` 中添加以下脚本：

```json
{
	"scripts": {
		"test": "vitest",
		"test:nitro": "vitest --run --node",
		"test:nitro:watch": "vitest --node"
	}
}
```

### 4.2 命令说明

| 命令                                         | 说明                             |
| :------------------------------------------- | :------------------------------- |
| `pnpm test`                                  | 运行原有的前端测试（jsdom 环境） |
| `pnpm test:nitro`                            | 运行 Nitro 接口测试（node 环境） |
| `pnpm test:nitro:watch`                      | 监听模式                         |
| `pnpm test:nitro -- tests/nitro/xxx.test.ts` | 指定单个测试文件                 |

### 4.3 测试流程

1. **终端 1**：启动 Nitro 服务器

   ```bash
   pnpm dev
   ```

2. **终端 2**：运行测试
   ```bash
   pnpm test:nitro
   ```

## 5. 文件位置规范

### 5.1 接口与测试文件对应关系

| 文件类型 | 位置                                         |
| :------- | :------------------------------------------- |
| 接口文件 | `server/api/{模块}/{功能}/{action}.post.ts`  |
| 测试文件 | `tests/nitro/{模块}/{功能}/{action}.test.ts` |

### 5.2 示例

- 接口：`server/api/users/list.post.ts`
- 测试：`tests/nitro/users/list.test.ts`

## 6. 常见问题

| 问题                                | 解决方案                                       |
| :---------------------------------- | :--------------------------------------------- |
| `Cannot find module 'setup-server'` | 使用别名导入：`import ... from "setup-server"` |
| `connect ECONNREFUSED`              | 先启动 Nitro 服务器：`pnpm dev`                |
| `Failed to parse source for .vue`   | 确保使用 `--node` 参数运行测试                 |
| 导入路径错误                        | 使用 `"setup-server"` 别名，不要使用相对路径   |

## 7. 测试检查清单

- [ ] 接口文件已创建：`server/api/xxx/xxx.post.ts`
- [ ] 测试文件已创建：`tests/nitro/xxx/xxx.test.ts`
- [ ] 测试文件使用正确的导入路径：`from "setup-server"`
- [ ] 测试用例包含基本的列表查询测试
- [ ] 测试可以通过 `pnpm test:nitro` 运行

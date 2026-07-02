# better-sqlite3 ABI 冲突修复报告

> 日期：2026-07-02  
> 执行环境：Windows 10 / Node 22.14.0 (ABI 127) + Node 24.18.0 (ABI 137)  
> 目标组件：memorix MCP 依赖的 `better-sqlite3@11.10.0`  
> 归档路径：`D:\code\ruan-cat\monorepo\docs\reports\`

---

## 1. 故障现象

memorix MCP 启动时进程崩溃退出，WorkBuddy 日志报 `MCP error -32000: Connection closed`。

错误核心栈：

```
Error: Could not locate the bindings file. Tried:
 → ...\better-sqlite3\build\Release\better_sqlite3.node
 → ...\compiled\22.14.0\win32\x64\better_sqlite3.node
```

**表面信息是 "找不到 bindings"，实际根因是 ABI 不匹配。**

---

## 2. 根因分析（双重重叠）

### 根因 A：pnpm 全局虚拟存储迁移导致路径分裂

- 旧 pnpm 虚拟存储路径：`C:\Users\pc\AppData\Local\pnpm\global\5\.pnpm\better-sqlite3@11.10.0\...`
- 新 pnpm 虚拟存储路径：`C:\Users\pc\AppData\Local\pnpm\global\5\node_modules\.pnpm\better-sqlite3@11.10.0\...`

memorix 的依赖符号链接指向**旧路径**，但旧路径中的包：
- 缺失 `binding.gyp`（导致后续 node-gyp 无法重新编译）
- `build/Release/` 目录为空

### 根因 B：预编译 binary 的 ABI 版本不匹配

新虚拟存储路径中有一份 `prebuild-install` 下载的预编译 binary：
- 编译时 ABI：**127**（Node 22）
- 当前系统默认 Node：**v24.18.0 / ABI 137**

Node.js 加载 `.node` 时检测到 ABI 不匹配，立即抛出 `ERR_DLOPEN_FAILED` 并终止进程。

### 关键行为：`bindings` 模块的搜索逻辑

`bindings` 库在 `lib/bindings.js` 中的逻辑：
1. 优先尝试 `build/Release/better_sqlite3.node`
2. 如果存在但 ABI 不匹配 → **直接抛出错误，终止搜索**
3. 不会继续尝试 `lib/binding/node-v{N}-win32-x64/` 路径

这意味着：
- 仅把正确的 binary 放入 `lib/binding/` **不够**
- 必须**清空或移除 `build/Release/` 目录**，才能启用 `lib/binding` 的 ABI 自动发现机制

---

## 3. 修复过程

### Step 1：补齐旧路径的构建材料

从 `node_modules/.pnpm/...` 复制 `binding.gyp` 到 `.pnpm/...`（memorix 实际引用的路径）。

```bash
cp \
  "C:/Users/pc/AppData/Local/pnpm/global/5/node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/binding.gyp" \
  "C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/binding.gyp"
```

### Step 2：修正 VS2022 工具集检测问题

node-gyp 9.4.0 为 Node 24 生成 MSBuild 项目时，将辅助目标 `locate_sqlite3` 误设为 `PlatformToolset=ClangCL`（用户未安装 ClangCL 工具）。

手动修正为 `v143`：

```bash
# 在以下 4 个 vcxproj 中替换 ClangCL → v143
# build/deps/locate_sqlite3.vcxproj
# build/better_sqlite3.vcxproj
# build/test_extension.vcxproj
# build/deps/sqlite3.vcxproj
```

### Step 3：本地编译 ABI 137 binary（Node 24）

```bash
cd "C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3"

# 使用 node-gyp 9.4.0 + Python 3.11.9 + VS2022 BuildTools
"D:/store/nvm-desktop/24.18.0/node.exe" \
  "C:/Users/pc/AppData/Local/pnpm/global/5/node_modules/.pnpm/cnpm@9.4.0/node_modules/cnpm/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" \
  rebuild --release \
  --python="C:\Users\pc\.pyenv\pyenv-win\versions\3.11.9\python3.exe"
```

输出：`build/Release/better_sqlite3.node`（ABI 137, 1.89 MB）

### Step 4：本地编译 ABI 127 binary（Node 22）

```bash
# 清空 build 目录，强制重新配置为 Node 22 的 ABI
rm -rf build

# 使用 Node 22 执行 configure + build
"D:/store/nvm-desktop/22.14.0/node.exe" \
  "C:/Users/pc/AppData/Local/pnpm/global/5/node_modules/.pnpm/cnpm@9.4.0/.../node-gyp.js" \
  configure --release --python="..."

MSBuild.exe build/binding.sln /p:Configuration=Release;Platform=x64
```

输出：`build/Release/better_sqlite3.node`（ABI 127, 1.87 MB）

### Step 5：构建 `lib/binding` 多 ABI 目录结构

```
.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/
├── build/Release/
│   └── (empty → 已清空，不再阻碍 lib/binding 回退)
└── lib/binding/
    ├── node-v127-win32-x64/
    │   └── better_sqlite3.node   ← Node 22 专用
    └── node-v137-win32-x64/
        └── better_sqlite3.node   ← Node 24 专用
```

### Step 6：同步双路径

pnpm 存在两个虚拟存储路径，均需保持一致的 `lib/binding/` 结构：

| 路径 | ABI 127 | ABI 137 |
|------|---------|---------|
| `.pnpm/...` | ✅ | ✅ |
| `node_modules/.pnpm/...` | ✅ | ✅ |

---

## 4. 验证结果

### 4.1 双路径 × 双 Node 版本交叉验证

```
Old path (.pnpm/...)              Node 22: PASS ✓   Node 24: PASS ✓
New path (node_modules/.pnpm/...) Node 22: PASS ✓   Node 24: PASS ✓
```

### 4.2 memorix MCP 启动验证

```bash
memorix serve --mode team
# → ObservationStore backend: sqlite, generation: 5390
# → MCP Server running on stdio
```

### 4.3 WorkBuddy 配置影响

- **未修改任何 WorkBuddy MCP 配置文件**（`mcp.json` 保持原样）
- `mcp-wrappers/memorix-serve.cmd` 仍可继续使用
- 由于 `better-sqlite3` 已原生支持 Node 24 的自动 ABI 发现，**memorix 已可直接使用系统默认 Node 24 运行**，不再需要强制降级到 Node 22

---

## 5. 关键经验教训

### 5.1 bindings 库的陷阱

`bindings` 模块在 `build/Release/` 存在但 ABI 不匹配时，会直接抛出错误终止搜索，不会继续回退到 `lib/binding/`。这是本次修复中最容易被忽略的行为。

### 5.2 pnpm 虚拟存储迁移的隐患

pnpm 10.x 升级后虚拟存储目录结构变化，导致旧路径和新路径并存，而依赖符号链接可能仍指向旧路径。如果旧路径中的包缺失关键文件（如 `binding.gyp`），会导致后续修复受阻。

### 5.3 node-gyp 9.4.0 + Node 24 的工具集问题

node-gyp 9.4.0 在检测 Node 24 时，生成 `locate_sqlite3` 辅助目标时误使用 `PlatformToolset=ClangCL`。如果用户未安装 ClangCL 组件，构建会在 `locate_sqlite3` 目标处失败。需要手动修正为 `v143`。

### 5.4 多 ABI 管理策略

对于需要同时支持多个 Node 版本的 Windows 环境：
- 不要依赖 `build/Release/` 的单一 binary
- 应使用 `lib/binding/node-v{N}-win32-x64/` 目录结构
- 确保 `build/Release/` 不存在或被清空，避免 `bindings` 模块的优先加载陷阱

---

## 6. 后续建议

### 6.1 优化 memorix wrapper

`mcp-wrappers/memorix-serve.cmd` 中的 `SET "PATH=D:\store\nvm-desktop\22.14.0;%PATH%"` 可以移除，让 memorix 直接使用系统默认 Node 24 启动。

### 6.2 建立 ABI 管理脚本

建议为 future Node 版本升级建立标准化脚本，自动执行：
1. 检测当前系统 Node 版本和 ABI
2. 为每个需要的 ABI 执行 `node-gyp rebuild`
3. 将结果写入 `lib/binding/node-v{N}-win32-x64/`
4. 清理 `build/Release/`

---

*报告生成时间：2026-07-02 20:30*  
*归档路径：`D:\code\ruan-cat\monorepo\docs\reports\better-sqlite3-abi-fix-report.md`*

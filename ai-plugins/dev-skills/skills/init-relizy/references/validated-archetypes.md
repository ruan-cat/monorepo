# 已验证原型与场景指引（匿名对照）

以下三类场景来自真实接入过程的**抽象**，用于对照决策；**不**绑定任何具体仓库名，也不假设目标仓库开源。每条原型附有「期望决策」，可用于验证技能理解是否正确。

## 原型 A：Runner + baseline 预检（Windows 兼容 + 标准 workspace）

**触发信号**：pnpm monorepo，主要开发环境为 Windows；dry-run 报 `grep`/`head`/`sed` 类错误；要求各包独立版本线；部分包缺 baseline package tags；团队接受维护根目录 runner 与测试。

**特征**：多应用目录 + 标准 workspace；Unix 工具依赖在 Windows PowerShell 下直接失败。

**策略要点**：`independent`；`monorepo.packages` 与真实 workspace 对齐；发版前检查 package baseline tags；用 runner 解决环境前置问题而非改 relizy 语义。

**期望决策（检查项）**：

- `versionMode` 应为 `independent`，不得用 `selective` 冒充独立版本线。
- 兼容策略应倾向 runner 或等价可测封装，并记录 precheck 逻辑。
- 缺 baseline tags 时应阻断并给出可执行的补 tag 建议，不得伪装成「正常无输出」。

---

## 原型 B：pnpm patch + 宽大 workspace（Windows 兼容 + 多 glob）

**触发信号**：pnpm workspace 含多类 glob（应用、遗留目录、包、配置目录等）；独立版本线；倾向用 `pnpm patch` 修补上游 relizy 以处理 Windows 调用问题。

**特征**：工作区范围更大，不可假设只有 `packages/*`；类型来自消费侧 config 包。

**策略要点**：`independent`；`packages` 数组覆盖所有目标 glob，**禁止**照抄其他仓库的 glob；类型与 changelogen 在 `changelog.config` 侧收口；patch 须记录版本 pin 与升级时重评流程。

**期望决策（检查项）**：

- `monorepo.packages` 必须与真实 workspace 对齐，不得照抄其他仓库。
- 兼容策略应倾向 `pnpm patch`，并说明上游版本 pin 与升级重评。
- 类型与 changelogen 收口优先在 `changelog.config` 侧，不在 `relizy.config` 中堆叠复杂样板。

---

## 原型 C：标准接入（无额外兼容层）

> ⚠️ 本原型要求满足严格前提，不应作为"默认轻量选项"随意套用。

**触发信号**：开发与 CI 环境均为 Linux/macOS；**已手工确认所有目标子包具备 baseline tag**；团队已建立新增子包后及时打 tag 的可靠流程；仅需标准 `changelog.config` + `relizy.config` 落盘与 README 同步。

**特征**：无 Windows 工具问题且 baseline tag 经过明确验证，方可选此路线。

**策略要点**：直接生成配置；验证矩阵仍须包含 dry-run；README 命令与脚本保持一致；使用前必须完成 [`references/windows-compatibility.md`](windows-compatibility.md) 中「放弃 runner 的前提条件」的全部确认项。

**期望决策（检查项）**：

- 在此场景下，仍不因为「可能遇到 Windows 问题」而预防性引入 runner。
- 验证矩阵必须包含 `relizy release --dry-run`。
- README 发版章节写法与 `package.json` 脚本完全一致。
- 必须有明确记录证明 baseline tag 已存在且流程可靠；否则应回退到原型 A（使用 runner）。

---

## 共同启示

- 先侦察再写配置；`selective` 不替代独立版本线。
- `private` 与 tag 必须显式确认。
- **Runner 是推荐默认策略**：它同时解决 Windows 工具依赖与 baseline tag 预检，两者都是 `independent` 模式下普遍存在的风险点，不仅限于特定平台。
- 无法确认所有子包 baseline tag 状态时，应始终选择 runner 或等价的自动化预检机制。

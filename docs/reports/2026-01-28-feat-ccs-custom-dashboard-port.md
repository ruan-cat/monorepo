# 2026-01-28-feat-ccs-custom-dashboard-port

## 背景

用户希望在使用 `ccs config` 命令时，能够将默认端口更改为 `3500`，而不是默认的 `3000`。为了实现这一需求，直接修改了 `ccs` 的源码以及用户的本地配置文件。

## 变更内容

### 1. 源码修改

修改了全局安装的 `ccs` 包中的 `commands/config-command.js` 文件。

**文件路径**: `C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/@kaitranntt+ccs@7.28.2_enquirer@2.3.6/node_modules/@kaitranntt/ccs/dist/commands/config-command.js`

**修改前**:

```javascript
// Find available port
const port =
	options.port ??
	(await (0, get_port_1.default)({
		port: [3000, 3001, 3002, 8000, 8080],
	}));
```

**修改后**:

```javascript
// Find available port
const defaultPort = config.preferences?.dashboard_port || 3000;
const port =
	options.port ??
	(await (0, get_port_1.default)({
		port: [defaultPort, 3000, 3001, 3002, 8000, 8080],
	}));
```

**说明**:

- 引入了 `unified-config-loader` 模块以读取配置。
- 在 `handleConfigCommand` 函数中，读取了配置对象。
- 在选择端口的逻辑中，优先使用 `config.preferences.dashboard_port` 作为首选端口。

### 2. 配置修改

修改了用户的本地配置文件 `~/.ccs/config.yaml`。

**文件路径**: `/c/Users/pc/.ccs/config.yaml`

**修改前**:

```yaml
preferences:
  theme: system
  telemetry: false
  auto_update: true
```

**修改后**:

```yaml
preferences:
  theme: system
  telemetry: false
  auto_update: true
  dashboard_port: 3500
```

**说明**:

- 在 `preferences` 部分新增了 `dashboard_port` 字段，并设置为 `3500`。

## 验证与影响

1.  **验证**: 执行 `ccs config` 命令时，系统将首先尝试绑定端口 `3500`。如果该端口可用，仪表板将在 `http://localhost:3500` 启动。
2.  **持久性**: 由于直接修改了 `node_modules` 内的源码，若用户后续通过 `pnpm` 更新了 `ccs` 包，此修改将被覆盖。建议用户在更新后重新检查或期待官方支持此配置项。
3.  **兼容性**: 如果配置文件中未设置 `dashboard_port`，逻辑会自动回退到默认的 `3000` 端口，保证了向后兼容性。

# pnpm 严格隔离与插件解析

## 两类故障必须分开

1. **找不到包**：配置文件、CLI 或编辑器进程从自己的解析根无法定位插件。
2. **找到错误入口**：包能解析，但实际版本或 CJS/ESM 入口与已验证矩阵不同。

pnpm 严格隔离主要解释第一类，不能修复第二类。添加 hoist 后能 `require.resolve`，也不代表 `1.0.3` 的 VSCode 字符串入口会正确工作。

## 现行排查顺序

1. 确认执行的 `prettier` 来自哪个 workspace。
2. 确认唯一配置文件属于哪个目录。
3. 在普通 CLI、experimental CLI 和 VSCode 各自的实际解析根检查插件是否可见。
4. 可见后继续核对解析到的包版本和入口，不得在“路径存在”处停止。
5. 只有 `require.resolve` 或等价解析确实失败时，才考虑 hoist。

## 条件式 hoist

项目确认需要让编辑器从根目录看见 Prettier 插件时，可以在用户授权后评估：

```ini
public-hoist-pattern[]=prettier
public-hoist-pattern[]=prettier-plugin-*
public-hoist-pattern[]=@prettier/*
```

修改 `.npmrc` 后必须重新安装依赖并重启编辑器。这是条件式修复，不是所有 pnpm 项目的默认模板。不要使用宽泛 hoist 掩盖错误的 workspace 依赖所有权。

## 常见误区

- 根 `devDependencies` 有插件，不等于从子包 cwd 执行时一定可见。
- VSCode 使用工作区 Prettier，不等于扩展进程一定从相同根解析插件。
- lockfile 中存在 `1.0.1`，不等于当前 importer 实际解析的就是 `1.0.1`。
- hoist 解决依赖可见性，不解决插件对象形态、override 位置或 CJS/ESM 入口错误。

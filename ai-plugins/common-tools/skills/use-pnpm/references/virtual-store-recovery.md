> **何时读**：Decision Path 判定为 global 场景、需恢复全局依赖树时；含备份、重建、无 TTY 临时 CI=true 放行与复查的完整命令序列。

## Windows Global Virtual Store Recovery

遇到全局 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` 时按这个顺序处理。

先备份全局元数据：

```powershell
$globalNodeModules = pnpm root -g
$globalDir = Split-Path -Parent $globalNodeModules
Copy-Item -LiteralPath "$globalDir\package.json" -Destination "$globalDir\package.json.bak" -ErrorAction SilentlyContinue
Copy-Item -LiteralPath "$globalDir\pnpm-lock.yaml" -Destination "$globalDir\pnpm-lock.yaml.bak" -ErrorAction SilentlyContinue
Copy-Item -LiteralPath "$globalNodeModules\.modules.yaml" -Destination "$globalDir\.modules.yaml.bak" -ErrorAction SilentlyContinue
```

再重建全局依赖树：

```powershell
pnpm i -g
```

如果当前环境无 TTY，且 `pnpm i -g` 因交互提示无法继续，可以只对这一次命令临时设置 `CI=true`：

```powershell
$hadCI = Test-Path Env:CI
$previousCI = $env:CI
try {
  $env:CI = "true"
  pnpm i -g
}
finally {
  if ($hadCI) {
    $env:CI = $previousCI
  }
  else {
    Remove-Item Env:CI -ErrorAction SilentlyContinue
  }
}
```

如果仍失败，再检查：

```powershell
pnpm config get virtual-store-dir
pnpm config list --location global
pnpm root -g
pnpm store path
```

不要把绝对 `virtual-store-dir` 写进全局 `.npmrc` 或全局 pnpm 配置来压住错误。绝对 virtual store 会把不同 Node、不同用户、不同全局区耦合到同一个布局路径，后续切 Node 或迁移目录时更容易复发。

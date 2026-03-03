# 环境变量格式识别与提取

## 用户提供的环境变量格式

用户可能以以下格式提供配置信息,您需要能够识别并提取:

### 格式 1:MiniMax 完整配置(PowerShell)

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOi...(JWT token 已脱敏)...S54jsg"
$env:ANTHROPIC_BASE_URL = "https://api.minimaxi.com/anthropic"
$env:ANTHROPIC_MODEL = "MiniMax-M2.5-highspeed"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "MiniMax-M2.5-highspeed"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "MiniMax-M2.5-highspeed"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "MiniMax-M2.5-highspeed"
claude --dangerously-skip-permissions
```

**提取要点**:

- `ANTHROPIC_AUTH_TOKEN`:JWT 格式的长 token(MiniMax 特有)
- `ANTHROPIC_BASE_URL`:`https://api.minimaxi.com/anthropic`
- `ANTHROPIC_MODEL`:`MiniMax-M2.5-highspeed`
- 可选的模型别名配置(`DEFAULT_HAIKU_MODEL` 等)

### 格式 2:Claude 代理服务配置(PowerShell)

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-be08aa56e195...(API Key 已脱敏)...57c1d12a"
$env:ANTHROPIC_BASE_URL = "https://www.ai-clauder.cc"
$env:CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS = "1"
claude --dangerously-skip-permissions
```

**提取要点**:

- `ANTHROPIC_AUTH_TOKEN`:`sk-` 开头的 API 密钥
- `ANTHROPIC_BASE_URL`:代理服务地址
- `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`:禁用实验性功能(可选)
- 注意:此格式没有指定 `ANTHROPIC_MODEL`,使用默认模型

### 格式 3:Bash 格式(Linux/Mac)

```bash
export ANTHROPIC_AUTH_TOKEN="your-token-here"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"
```

**提取要点**:

- 使用 `export` 而不是 `$env:`
- 值用双引号包裹
- 格式:`export VAR_NAME="value"`

## 环境变量提取规则

当用户提供配置信息时,按以下规则提取:

### 1. 识别格式

- PowerShell:`$env:VAR_NAME = "value"`
- Bash:`export VAR_NAME="value"`

### 2. 必需变量

- `ANTHROPIC_AUTH_TOKEN`:必需
- `ANTHROPIC_BASE_URL`:必需

### 3. 可选变量

- `ANTHROPIC_MODEL`:如果未提供,使用默认值或询问用户
- `ANTHROPIC_DEFAULT_*_MODEL`:模型别名,可忽略
- `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`:功能开关,可忽略

### 4. Token 格式识别

- JWT 格式(MiniMax):以 `eyJ` 开头,包含两个点(`.`)
- API Key 格式:以 `sk-` 开头
- 其他格式:直接使用

### 5. 转换为 Bash 格式

无论用户提供什么格式,最终都转换为 Bash 格式用于启动脚本:

```bash
export ANTHROPIC_AUTH_TOKEN="extracted-token"
export ANTHROPIC_BASE_URL="extracted-url"
export ANTHROPIC_MODEL="extracted-model"
```

## 提取示例

### 示例 1:从 PowerShell 提取

**用户提供**:

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-xxxxx"
$env:ANTHROPIC_BASE_URL = "https://api.minimaxi.com/anthropic"
```

**提取并转换为 Bash**:

```bash
export ANTHROPIC_AUTH_TOKEN="sk-xxxxx"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
```

**提取规则**:

1. 移除 `$env:` 前缀
2. 将 `=` 替换为 `=`
3. 添加 `export` 前缀
4. 确保值用双引号包裹

### 示例 2:识别 JWT Token

**用户提供**:

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOi...(JWT token 已脱敏)...S54jsg"
```

**识别为 JWT**:

- 以 `eyJ` 开头
- 包含两个点(`.`)
- 这是 MiniMax 的 JWT token 格式

### 示例 3:识别 API Key

**用户提供**:

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-be08aa56e195...(API Key 已脱敏)...57c1d12a"
```

**识别为 API Key**:

- 以 `sk-` 开头
- 这是标准的 Claude API Key 格式

## 安全注意事项

1. **脚本中包含敏感的 API 密钥**
2. **执行完成后应立即删除脚本文件**
3. **或者使用环境变量文件(`.env`)管理配置**

参见 `code-templates.md` 中的"环境变量文件模板"了解如何使用 `.env` 文件。

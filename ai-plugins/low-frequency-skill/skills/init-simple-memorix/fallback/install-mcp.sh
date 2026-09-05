#!/usr/bin/env bash
# shellcheck disable=SC2001,SC2181
#
# 安装/更新 Memorix MCP 配置到本地 AI Agent 工具。
# 兼容 macOS / Linux / WSL 的 Bash。
#
# Usage:
#   ./install-mcp.sh [-d] [-c <path>] [-h]
#
# Options:
#   -d          Dry-run: preview changes without writing files.
#   -c <path>   Additional config file path (can be used multiple times).
#   -h          Show this help message.

set -euo pipefail

# ---------------------------------------------------------------------------
# 默认值 / 状态
# ---------------------------------------------------------------------------
DRY_RUN=false
EXTRA_CONFIGS=()

# ---------------------------------------------------------------------------
# 解析参数
# ---------------------------------------------------------------------------
while getopts ":dc:h" opt; do
    case $opt in
        d)
            DRY_RUN=true
            ;;
        c)
            EXTRA_CONFIGS+=("$OPTARG")
            ;;
        h)
            cat <<'EOF'
Usage: ./install-mcp.sh [-d] [-c <path>] [-h]

Options:
  -d          Dry-run: preview changes without writing files.
  -c <path>   Additional config file path (can be used multiple times).
  -h          Show this help message.

Supported platforms: codex, claude, cursor, workbuddy, zcode, qoder, kiro
EOF
            exit 0
            ;;
        \?)
            echo '{"status":"error","error":"Invalid option: -'$OPTARG'"}' >&2
            exit 1
            ;;
        :)
            echo '{"status":"error","error":"Option -'$OPTARG' requires an argument."}' >&2
            exit 1
            ;;
    esac
done
shift $((OPTIND - 1))

# ---------------------------------------------------------------------------
# 配置文件定义：platform => 路径数组（基于 $HOME）
# ---------------------------------------------------------------------------
declare -A CONFIG_PATHS
declare -a PLATFORM_ORDER

PLATFORM_ORDER=(codex claude cursor workbuddy zcode qoder kiro)

CONFIG_PATHS[codex]="$HOME/.codex/config.toml $HOME/.codex/config-2026-6-13-bg.toml"
CONFIG_PATHS[claude]="$HOME/.claude.json"
CONFIG_PATHS[cursor]="$HOME/.cursor/mcp.json"
CONFIG_PATHS[workbuddy]="$HOME/.workbuddy/mcp.json $HOME/.workbuddy/.mcp.json"
CONFIG_PATHS[zcode]="$HOME/.zcode/cli/config.json"
CONFIG_PATHS[qoder]="$HOME/AppData/Roaming/Qoder/SharedClientCache/mcp.json"
CONFIG_PATHS[kiro]="$HOME/.kiro/settings/mcp.json"

# 加入用户传入的额外路径
if [ ${#EXTRA_CONFIGS[@]} -gt 0 ]; then
    PLATFORM_ORDER+=(custom)
    CONFIG_PATHS[custom]="${EXTRA_CONFIGS[*]}"
fi

# 期望的 memorix 配置
MEMORIX_COMMAND="memorix"
MEMORIX_ARGS='["serve", "--mode", "full"]'

# ---------------------------------------------------------------------------
# Helper：输出结构化 JSON 行
# ---------------------------------------------------------------------------
emit_result() {
    local platform="$1"
    local config_file="$2"
    local status="$3"   # ok | created | updated | skipped | error
    local error_msg="${4:-}"

    if [ -n "$error_msg" ]; then
        printf '{"platform":"%s","configFile":"%s","status":"%s","error":"%s"}\n' \
            "$platform" "$config_file" "$status" "$error_msg"
    else
        printf '{"platform":"%s","configFile":"%s","status":"%s"}\n' \
            "$platform" "$config_file" "$status"
    fi
}

# 转义字符串用于 JSON（简单版本：替换 \ 和 "）
json_escape() {
    local str="$1"
    str="${str//\\/\\\\}"
    str="${str//\"/\\\"}"
    printf '%s' "$str"
}

# ---------------------------------------------------------------------------
# JSON 处理辅助函数
# ---------------------------------------------------------------------------
has_jq() {
    command -v jq >/dev/null 2>&1
}

# 使用 jq 处理 JSON
process_json_jq() {
    local platform="$1"
    local file_path="$2"

    if [ ! -f "$file_path" ]; then
        if [ "$DRY_RUN" = true ]; then
            emit_result "$platform" "$file_path" "skipped" "File not found (dry-run, would create)"
            return
        fi

        local dir
        dir="$(dirname "$file_path")"
        if [ ! -d "$dir" ]; then
            if ! mkdir -p "$dir" 2>/dev/null; then
                emit_result "$platform" "$file_path" "error" "Failed to create directory"
                return
            fi
        fi

        local new_config
        new_config="{\"mcpServers\":{\"memorix\":{\"command\":\"$MEMORIX_COMMAND\",\"args\":$MEMORIX_ARGS}}}"
        if printf '%s\n' "$new_config" > "$file_path"; then
            emit_result "$platform" "$file_path" "created"
        else
            emit_result "$platform" "$file_path" "error" "Failed to write file"
        fi
        return
    fi

    # 读取 JSON
    local json_content
    if ! json_content="$(cat "$file_path" 2>/dev/null)"; then
        emit_result "$platform" "$file_path" "error" "Failed to read file"
        return
    fi

    # 验证 JSON
    if ! printf '%s' "$json_content" | jq empty 2>/dev/null; then
        emit_result "$platform" "$file_path" "error" "Failed to parse JSON"
        return
    fi

    # 检查是否需要更新
    local existing_cmd existing_args
    existing_cmd=$(printf '%s' "$json_content" | jq -r '.mcpServers.memorix.command // ""' 2>/dev/null)
    existing_args=$(printf '%s' "$json_content" | jq '.mcpServers.memorix.args // []' 2>/dev/null)

    local needs_update=false
    if [ "$existing_cmd" != "$MEMORIX_COMMAND" ]; then
        needs_update=true
    fi
    if [ "$existing_args" != "$MEMORIX_ARGS" ]; then
        needs_update=true
    fi

    if [ "$needs_update" = false ]; then
        emit_result "$platform" "$file_path" "ok"
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        emit_result "$platform" "$file_path" "skipped" "Would update args (dry-run)"
        return
    fi

    # 更新 JSON
    local updated
    updated=$(printf '%s' "$json_content" | jq \
        --arg cmd "$MEMORIX_COMMAND" \
        --argjson args "$MEMORIX_ARGS" \
        '.mcpServers.memorix.command = $cmd | .mcpServers.memorix.args = $args' 2>/dev/null)

    if [ -z "$updated" ]; then
        emit_result "$platform" "$file_path" "error" "Failed to update JSON"
        return
    fi

    if printf '%s\n' "$updated" | jq . > "$file_path" 2>/dev/null; then
        emit_result "$platform" "$file_path" "updated"
    else
        emit_result "$platform" "$file_path" "error" "Failed to write file"
    fi
}

# 不使用 jq，纯文本方式处理 JSON（仅处理已存在的配置，不做复杂解析）
process_json_fallback() {
    local platform="$1"
    local file_path="$2"

    if [ ! -f "$file_path" ]; then
        if [ "$DRY_RUN" = true ]; then
            emit_result "$platform" "$file_path" "skipped" "File not found (dry-run, would create; jq not available)"
        else
            # 尝试创建简单 JSON
            local dir
            dir="$(dirname "$file_path")"
            if [ ! -d "$dir" ]; then
                mkdir -p "$dir" 2>/dev/null || {
                    emit_result "$platform" "$file_path" "error" "Failed to create directory"
                    return
                }
            fi
            printf '{\n  "mcpServers": {\n    "memorix": {\n      "command": "memorix",\n      "args": ["serve", "--mode", "full"]\n    }\n  }\n}\n' > "$file_path" 2>/dev/null && \
                emit_result "$platform" "$file_path" "created" || \
                emit_result "$platform" "$file_path" "error" "Failed to write file"
        fi
        return
    fi

    # 文件存在，尝试 sed 替换
    local content
    if ! content="$(cat "$file_path" 2>/dev/null)"; then
        emit_result "$platform" "$file_path" "error" "Failed to read file"
        return
    fi

    # 简单检查：看内容里有没有 "memorix"，如果没有提示用户
    if ! printf '%s' "$content" | grep -q '"memorix"'; then
        emit_result "$platform" "$file_path" "skipped" "No memorix config found and jq not available for safe modification"
        return
    fi

    # 尝试用 sed 替换 args（非常简单的模式）
    local new_content
    # 尝试替换 "args": [...] 或 "args": [ ... ]
    new_content=$(printf '%s' "$content" | sed 's/"args"[[:space:]]*:[[:space:]]*\[[^]]*\]/"args": ["serve", "--mode", "full"]/g' 2>/dev/null)

    # 同时替换 command
    new_content=$(printf '%s' "$new_content" | sed 's/"command"[[:space:]]*:[[:space:]]*"[^"]*"/"command": "memorix"/g' 2>/dev/null)

    if [ "$new_content" = "$content" ]; then
        emit_result "$platform" "$file_path" "ok"
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        emit_result "$platform" "$file_path" "skipped" "Would update args (dry-run, jq not available)"
        return
    fi

    if printf '%s\n' "$new_content" > "$file_path" 2>/dev/null; then
        emit_result "$platform" "$file_path" "updated"
    else
        emit_result "$platform" "$file_path" "error" "Failed to write file"
    fi
}

process_json() {
    local platform="$1"
    local file_path="$2"

    if has_jq; then
        process_json_jq "$platform" "$file_path"
    else
        process_json_fallback "$platform" "$file_path"
    fi
}

# ---------------------------------------------------------------------------
# TOML 处理（仅 Codex）
# ---------------------------------------------------------------------------
process_toml() {
    local platform="$1"
    local file_path="$2"

    if [ ! -f "$file_path" ]; then
        if [ "$DRY_RUN" = true ]; then
            emit_result "$platform" "$file_path" "skipped" "File not found (dry-run, would create)"
            return
        fi

        local dir
        dir="$(dirname "$file_path")"
        if [ ! -d "$dir" ]; then
            if ! mkdir -p "$dir" 2>/dev/null; then
                emit_result "$platform" "$file_path" "error" "Failed to create directory"
                return
            fi
        fi

        cat > "$file_path" <<'EOF'
[mcpServers.memorix]
command = "memorix"
args = ["serve", "--mode", "full"]
EOF
        emit_result "$platform" "$file_path" "created"
        return
    fi

    # 读取内容
    local content
    if ! content="$(cat "$file_path" 2>/dev/null)"; then
        emit_result "$platform" "$file_path" "error" "Failed to read file"
        return
    fi

    # 检查是否已有 [mcpServers.memorix]
    if printf '%s' "$content" | grep -q '^\s*\[mcpServers\.memorix\]\s*$'; then
        # 已有 section，尝试替换 args
        local new_content
        # 先尝试替换 args = [...]
        new_content=$(printf '%s' "$content" | sed '/\[mcpServers\.memorix\]/,/^\s*\[/ { s/args\s*=\s*\[[^]]*\]/args = ["serve", "--mode", "full"]/ }' 2>/dev/null)

        # 如果 sed 没有产生变化（可能没有 args 行），在 section 后插入
        if [ "$new_content" = "$content" ]; then
            new_content=$(printf '%s' "$content" | sed '/\[mcpServers\.memorix\]/a args = ["serve", "--mode", "full"]' 2>/dev/null)
        fi

        if [ "$new_content" = "$content" ]; then
            emit_result "$platform" "$file_path" "ok"
            return
        fi

        if [ "$DRY_RUN" = true ]; then
            emit_result "$platform" "$file_path" "skipped" "Would update args (dry-run)"
            return
        fi

        if printf '%s\n' "$new_content" > "$file_path" 2>/dev/null; then
            emit_result "$platform" "$file_path" "updated"
        else
            emit_result "$platform" "$file_path" "error" "Failed to write file"
        fi
    else
        # 没有 section，追加
        if [ "$DRY_RUN" = true ]; then
            emit_result "$platform" "$file_path" "skipped" "Would append section (dry-run)"
            return
        fi

        {
            printf '\n[mcpServers.memorix]\n'
            printf 'command = "memorix"\n'
            printf 'args = ["serve", "--mode", "full"]\n'
        } >> "$file_path"
        emit_result "$platform" "$file_path" "updated"
    fi
}

# ---------------------------------------------------------------------------
# 主逻辑：遍历所有配置
# ---------------------------------------------------------------------------
for platform in "${PLATFORM_ORDER[@]}"; do
    paths="${CONFIG_PATHS[$platform]:-}"
    for file_path in $paths; do
        # 展开路径（处理 ~ 等）
        file_path="${file_path/#\~/$HOME}"

        if [ -z "$file_path" ]; then
            continue
        fi

        if [[ "$file_path" == *.toml ]]; then
            process_toml "$platform" "$file_path"
        else
            process_json "$platform" "$file_path"
        fi
    done
done

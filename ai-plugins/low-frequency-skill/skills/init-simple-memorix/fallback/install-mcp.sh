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
CONFIG_PATHS[qoder]="$HOME/.qoder/mcp.json"
CONFIG_PATHS[kiro]="$HOME/.kiro/settings/mcp.json"

# 加入用户传入的额外路径
if [ ${#EXTRA_CONFIGS[@]} -gt 0 ]; then
    PLATFORM_ORDER+=(custom)
    CONFIG_PATHS[custom]="${EXTRA_CONFIGS[*]}"
fi

# 期望的 memorix 配置
MEMORIX_COMMAND="memorix"
MEMORIX_MODE="micro"
MEMORIX_ARGS='["serve", "--mode", "micro"]'

# ---------------------------------------------------------------------------
# server 定义的键路径
#   - JSON 平台：键路径。多数平台是 mcpServers；ZCode 是嵌套的 mcp.servers。
#   - TOML 平台：表名。Codex 是 mcp_servers（下划线，不是 mcpServers）。
# 写错这里会让脚本找不到已有 entry，转而在配置文件里新增一个目标程序不识别的键。
# ---------------------------------------------------------------------------
declare -A SERVER_PATH
SERVER_PATH[codex]="mcp_servers"
SERVER_PATH[zcode]="mcp.servers"

server_path_of() {
    local platform="$1"
    printf '%s' "${SERVER_PATH[$platform]:-mcpServers}"
}

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

# 判断内容是否为 CRLF 行尾（输出 1 = 是，0 = 否）
# ⚠️ 不要用 `grep -q $'\r'`：在本机 Git Bash 下对 CRLF 文件会误判成 LF。
detect_crlf() {
    if [ -n "$(printf '%s' "$1" | tr -d -c '\r')" ]; then
        printf '1'
    else
        printf '0'
    fi
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
    local sp
    sp="$(server_path_of "$platform")"

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

        # 按 serverPath 逐级包出 {mcp: {servers: {memorix: {...}}}}
        local new_config
        new_config="$(jq -n --arg sp "$sp" --arg cmd "$MEMORIX_COMMAND" --argjson args "$MEMORIX_ARGS" '
            ($sp | split(".")) as $path
            | reduce ($path | reverse[]) as $k
                ({ memorix: { command: $cmd, args: $args } }; { ($k): . })
        ' 2>/dev/null)"

        if [ -n "$new_config" ] && printf '%s\n' "$new_config" > "$file_path" 2>/dev/null; then
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

    # 是否需要更新：只看 mode 是否已达标。
    # 裸 serve（无 --mode）等价 micro；command 一律不动（Codex 等用 `cmd /c ...` 启动器）。
    local needs_update
    needs_update="$(printf '%s' "$json_content" | jq -r --arg sp "$sp" --arg mode "$MEMORIX_MODE" '
        ($sp | split(".")) as $path
        | (getpath($path + ["memorix", "args"]) // null) as $a
        | if ($a | type) != "array" or (($a | length) == 0) then "true"
          elif (($a | index("serve")) == null) then "true"
          else
            (($a | index("--mode"))) as $m
            | if $m == null then "false"
              elif $a[$m + 1] == $mode then "false"
              else "true"
              end
          end
    ' 2>/dev/null)"

    if [ "$needs_update" != "true" ]; then
        emit_result "$platform" "$file_path" "ok"
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        emit_result "$platform" "$file_path" "skipped" "Would update args (dry-run)"
        return
    fi

    # 只调整 --mode，保留启动器前缀（如 Codex 的 ["/c", "memorix.cmd"]）
    local updated
    updated="$(printf '%s' "$json_content" | jq \
        --arg sp "$sp" \
        --arg mode "$MEMORIX_MODE" \
        --arg cmd "$MEMORIX_COMMAND" \
        --argjson defaultArgs "$MEMORIX_ARGS" '
        ($sp | split(".")) as $path
        | ($path + ["memorix"]) as $mp
        | (getpath($mp) // null) as $node
        | if $node == null then
            # 新建 entry 时必须 **在原文基础上 setpath**，不能直接返回构造出来的对象：
            # setpath 会沿路径补建中间层，同时完整保留文件里已有的其它 server。
            # （旧实现用 reduce 直接产出新对象，会把 github / codegraph 等条目整体丢掉。）
            setpath($mp; { command: $cmd, args: $defaultArgs })
          else
            ($node.args // []) as $a
            | (($a | index("--mode"))) as $m
            | (if $m != null then
                 (if ($m + 1) < ($a | length) then ($a | .[$m + 1] = $mode) else ($a + [$mode]) end)
               else
                 (($a | index("serve"))) as $s
                 | (if $s != null then ($a[0:$s+1] + ["--mode", $mode] + $a[$s+1:])
                    else ($a + ["serve", "--mode", $mode]) end)
               end) as $newArgs
            | setpath($mp + ["args"]; $newArgs)
          end
    ' 2>/dev/null)"

    if [ -z "$updated" ] || [ "$updated" = "null" ]; then
        emit_result "$platform" "$file_path" "error" "Failed to update JSON"
        return
    fi

    # jq 在 Windows 下输出 CRLF，而多数配置文件是 LF。
    # 按原文件的行尾与「结尾是否带换行」写回，避免整文件翻转或尾行噪音 diff。
    local tmp_file="${file_path}.tmp.$$"
    local formatted wrote_ok=1
    formatted="$(printf '%s\n' "$updated" | jq . 2>/dev/null | tr -d '\r')"

    if [ -z "$formatted" ]; then
        emit_result "$platform" "$file_path" "error" "Failed to format JSON"
        return
    fi

    # 命令替换会剥掉全部结尾换行，所以不能靠 $json_content 判断，
    # 必须直接探测原文件的最后一个字节（0a = 以换行收尾；CRLF 文件同样是 0a）。
    local orig_tail
    orig_tail="$(tail -c 1 "$file_path" 2>/dev/null | od -An -tx1 | tr -d ' \n')"
    if [ "$orig_tail" = "0a" ]; then
        formatted="$formatted"$'\n'
    fi

    if [ "$(detect_crlf "$json_content")" = "1" ]; then
        # 这里不能再套一层 $(...)，否则刚补回的结尾换行又会被剥掉。
        if printf '%s' "$formatted" | sed 's/$/\r/' > "$tmp_file" 2>/dev/null; then
            wrote_ok=0
        fi
    else
        if printf '%s' "$formatted" > "$tmp_file" 2>/dev/null; then
            wrote_ok=0
        fi
    fi

    if [ "$wrote_ok" = "0" ] && mv "$tmp_file" "$file_path" 2>/dev/null; then
        emit_result "$platform" "$file_path" "updated"
    else
        rm -f "$tmp_file" 2>/dev/null || true
        emit_result "$platform" "$file_path" "error" "Failed to write file"
    fi
}

# 不使用 jq 时的降级路径。
#
# 旧实现用全局 sed 替换，会把文件里**所有** `"args"` / `"command"` 字段一起改写
# （实测会把 chrome-devtools / vercel / github / agent-browser 的 args 全部覆盖成
# memorix 的取值），属于高危行为。现改为：**能安全创建就创建，不能安全修改就拒绝**。
process_json_fallback() {
    local platform="$1"
    local file_path="$2"
    local sp
    sp="$(server_path_of "$platform")"

    if [ -f "$file_path" ]; then
        emit_result "$platform" "$file_path" "error" \
            "jq not available: refusing to modify existing JSON. Install jq, or run scripts/install-mcp.ts instead."
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        emit_result "$platform" "$file_path" "skipped" "File not found (dry-run, would create; jq not available)"
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

    # 按 serverPath 拼出嵌套外壳：{"mcp":{"servers":{...}}}
    local open="" close="" rest="$sp" key
    while [ -n "$rest" ]; do
        key="${rest%%.*}"
        if [ "$key" = "$rest" ]; then
            rest=""
        else
            rest="${rest#*.}"
        fi
        open="${open}{\"${key}\":"
        close="}${close}"
    done

    if printf '%s{"memorix":{"command":"%s","args":%s}}%s\n' \
        "$open" "$MEMORIX_COMMAND" "$MEMORIX_ARGS" "$close" > "$file_path" 2>/dev/null; then
        emit_result "$platform" "$file_path" "created"
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
# 在 $1（TOML 全文）的 [<table>.memorix] section 内取出 args 行；取不到返回空串
toml_section_args_line() {
    local content="$1"
    local section_esc="$2"
    local range
    range="$(printf '%s' "$content" | sed -n "/^[[:space:]]*\[${section_esc}\][[:space:]]*$/,/^[[:space:]]*\[/p" 2>/dev/null || true)"
    printf '%s' "$range" | grep -m1 -E 'args[[:space:]]*=' 2>/dev/null || true
}

process_toml() {
    local platform="$1"
    local file_path="$2"
    local table
    table="$(server_path_of "$platform")"
    local section_esc="${table//./\\.}\\.memorix"
    local section_header="[${table}.memorix]"

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

        {
            printf '%s\n' "$section_header"
            printf 'command = "memorix"\n'
            printf 'args = %s\n' "$MEMORIX_ARGS"
        } > "$file_path"
        emit_result "$platform" "$file_path" "created"
        return
    fi

    # 读取内容
    local content
    if ! content="$(cat "$file_path" 2>/dev/null)"; then
        emit_result "$platform" "$file_path" "error" "Failed to read file"
        return
    fi

    # 没有目标 section → 追加
    if ! printf '%s' "$content" | grep -qE "^[[:space:]]*\[${section_esc}\][[:space:]]*$"; then
        if [ "$DRY_RUN" = true ]; then
            emit_result "$platform" "$file_path" "skipped" "Would append section (dry-run)"
            return
        fi

        {
            printf '\n%s\n' "$section_header"
            printf 'command = "memorix"\n'
            printf 'args = %s\n' "$MEMORIX_ARGS"
        } >> "$file_path"
        emit_result "$platform" "$file_path" "updated"
        return
    fi

    # 已有 section：先判断 mode 是否已达标（裸 serve 等价 micro）
    local args_line
    args_line="$(toml_section_args_line "$content" "$section_esc")"

    if [ -n "$args_line" ]; then
        if printf '%s' "$args_line" | grep -q -- '--mode'; then
            if printf '%s' "$args_line" | grep -qE -- "--mode\"[[:space:]]*,[[:space:]]*\"${MEMORIX_MODE}\""; then
                emit_result "$platform" "$file_path" "ok"
                return
            fi
        elif printf '%s' "$args_line" | grep -q -- 'serve'; then
            emit_result "$platform" "$file_path" "ok"
            return
        fi
    fi

    if [ "$DRY_RUN" = true ]; then
        emit_result "$platform" "$file_path" "skipped" "Would update args (dry-run)"
        return
    fi

    # 只替换 section 内 --mode 的取值，保留 ["/c", "memorix.cmd"] 这类启动器前缀
    local new_content
    if [ -n "$args_line" ]; then
        new_content="$(printf '%s' "$content" | sed -E \
            "/^[[:space:]]*\[${section_esc}\][[:space:]]*$/,/^[[:space:]]*\[/ s/(\"--mode\"[[:space:]]*,[[:space:]]*)\"[^\"]*\"/\1\"${MEMORIX_MODE}\"/" 2>/dev/null || true)"
    else
        # section 存在但没有 args 行：插到 section 头之后
        new_content="$(printf '%s' "$content" | sed -E \
            "/^[[:space:]]*\[${section_esc}\][[:space:]]*$/a\\
args = ${MEMORIX_ARGS}
" 2>/dev/null || true)"
    fi

    if [ -z "$new_content" ] || [ "$new_content" = "$content" ]; then
        emit_result "$platform" "$file_path" "error" \
            "Cannot safely set mode in ${section_header}: no --mode token to replace. Run scripts/install-mcp.ts instead."
        return
    fi

    if printf '%s\n' "$new_content" > "$file_path" 2>/dev/null; then
        emit_result "$platform" "$file_path" "updated"
    else
        emit_result "$platform" "$file_path" "error" "Failed to write file"
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

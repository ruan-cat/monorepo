#!/usr/bin/env bash

# 本地全局 Agent Skills 同步器兜底脚本（Bash）。
# 将 ~/.agents/skills 作为目录级软链接分发到 WorkBuddy、QoderWork、Kimi Work 平台。
# 在无法使用 Node/TypeScript 主脚本时作为兜底方案。

set -euo pipefail

SOURCE="${HOME}/.agents/skills"
DRY_RUN=0
NO_BACKUP=0
SKIP_MEMORIX_REFRESH=0
FORCE_MEMORIX_REFRESH=0

usage() {
  cat <<EOF
Usage: sync.sh [options]

Options:
  -s, --source <path>   Source skills directory (default: ~/.agents/skills)
  -d, --dry-run         Print the plan without modifying the filesystem
  -n, --no-backup       Do not backup existing directories before replacing
  -h, --help            Show this help message
  --skip-memorix-refresh    Skip scanning local memorix skills sources before sync
  --force-memorix-refresh   Overwrite existing memorix skills in target directory
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--source)
      SOURCE="$2"
      shift 2
      ;;
    -d|--dry-run)
      DRY_RUN=1
      shift
      ;;
    -n|--no-backup)
      NO_BACKUP=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --skip-memorix-refresh)
      SKIP_MEMORIX_REFRESH=1
      shift
      ;;
    --force-memorix-refresh)
      FORCE_MEMORIX_REFRESH=1
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

# ---------- memorix refresh ----------
if [ "$SKIP_MEMORIX_REFRESH" != "1" ]; then
    CANDIDATES="$HOME/.cursor/skills $HOME/.codex/plugins/memorix/skills $HOME/.claude/plugins/marketplaces/memorix-local/plugins/memorix/skills"
    SOURCE_DIR=""
    for dir in $CANDIDATES; do
        if [ -d "$dir" ]; then SOURCE_DIR="$dir"; break; fi
    done
    if [ -n "$SOURCE_DIR" ]; then
        for skill in "$SOURCE_DIR"/memorix-*; do
            [ -d "$skill" ] || continue
            target="$HOME/.agents/skills/$(basename "$skill")"
            if [ ! -d "$target" ] || [ "$FORCE_MEMORIX_REFRESH" = "1" ]; then
                cp -r "$skill" "$target"
            fi
        done
    else
        echo "WARN: 未找到本地 memorix skills 来源，跳过刷新" >&2
    fi
fi

if [[ ! -d "$SOURCE" ]]; then
  echo "Source directory does not exist: $SOURCE" >&2
  exit 1
fi

HOME_WIN="${USERPROFILE:-$HOME}"

platforms=(
  "WorkBuddy:${HOME_WIN}/.workbuddy/skills"
  "QoderWork:${HOME_WIN}/.qoderworkcn/skills"
  "Kimi Work:${HOME_WIN}/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills"
  "CodeBuddy:${HOME_WIN}/.codebuddy/skills"
)

backup_dir() {
  local src="$1"
  local suffix
  suffix="$(date +%Y%m%d%H%M%S)-$(uuidgen 2>/dev/null || echo $$)"
  local dest="${src}.bak.${suffix}"
  mv "$src" "$dest"
  echo "$dest"
}

for entry in "${platforms[@]}"; do
  name="${entry%%:*}"
  skills_dir="${entry#*:}"
  status="skipped"
  previous_type=""
  backup_path=""
  error=""

  parent="$(dirname "$skills_dir")"
  if [[ ! -d "$parent" ]]; then
    if [[ "$DRY_RUN" -eq 0 ]]; then
      mkdir -p "$parent"
    fi
  fi

  if [[ ! -e "$skills_dir" ]]; then
    if [[ "$DRY_RUN" -eq 0 ]]; then
      ln -s "$SOURCE" "$skills_dir"
    fi
    status="created"
  elif [[ -L "$skills_dir" ]]; then
    current_target="$(readlink "$skills_dir")"
    if [[ "$current_target" == "$SOURCE" ]]; then
      status="skipped"
    else
      previous_type="symlink"
      if [[ "$DRY_RUN" -eq 0 ]]; then
        rm "$skills_dir"
        ln -s "$SOURCE" "$skills_dir"
      fi
      status="replaced"
    fi
  elif [[ -d "$skills_dir" ]]; then
    previous_type="directory"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      if [[ "$NO_BACKUP" -eq 0 ]]; then
        backup_path="$(backup_dir "$skills_dir")"
      else
        rm -rf "$skills_dir"
      fi
      ln -s "$SOURCE" "$skills_dir"
    fi
    status="replaced"
  else
    previous_type="file"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      rm "$skills_dir"
      ln -s "$SOURCE" "$skills_dir"
    fi
    status="replaced"
  fi

  printf '{"platform":"%s","skillsDir":"%s","status":"%s","previousType":"%s","backupPath":"%s","error":"%s"}\n' \
    "$name" "$skills_dir" "$status" "$previous_type" "$backup_path" "$error"
done

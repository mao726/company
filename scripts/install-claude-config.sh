#!/usr/bin/env bash
# このリポジトリの Claude Code 設定（エージェント・スキル・共通ルール）を
# ユーザー全体の設定（~/.claude）に入れる。どのフォルダで作業しても使えるようになる。
#
# 使い方：
#   bash scripts/install-claude-config.sh            # インストール
#   bash scripts/install-claude-config.sh --dry-run  # 何が変わるか表示だけ
#
# 既存のファイルは上書きせず ~/.claude/backups/ に退避してから置き換える。
# ~/.claude/CLAUDE.md は丸ごと置き換えず、目印で囲んだ部分だけを追加・更新する。
set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
BACKUP="$TARGET/backups/company-config-$(date +%Y%m%d-%H%M%S)"
BEGIN_MARK="<!-- BEGIN company-config -->"
END_MARK="<!-- END company-config -->"

run() { if [[ $DRY_RUN -eq 1 ]]; then echo "[dry-run] $*"; else "$@"; fi; }

backup_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    run mkdir -p "$BACKUP/$(dirname "${path#"$TARGET"/}")"
    run cp -R "$path" "$BACKUP/${path#"$TARGET"/}"
    echo "退避: $path -> $BACKUP"
  fi
}

install_file() {
  local src="$1" dest="$2"
  if [[ -f "$dest" ]] && cmp -s "$src" "$dest"; then
    echo "変更なし: $dest"
    return
  fi
  backup_if_exists "$dest"
  run mkdir -p "$(dirname "$dest")"
  run cp "$src" "$dest"
  echo "配置: $dest"
}

# 1. エージェント
for f in "$REPO_DIR"/.claude/agents/*.md; do
  install_file "$f" "$TARGET/agents/$(basename "$f")"
done

# 2. スキル
for d in "$REPO_DIR"/.claude/skills/*/; do
  name="$(basename "$d")"
  for f in "$d"*; do
    install_file "$f" "$TARGET/skills/$name/$(basename "$f")"
  done
done

# 3. 共通ルール（目印で囲んだ部分だけ更新）
#    リポジトリ外でも使えるよう、学びの記録の置き場所を ~/.claude/lessons/log.md に読み替える。
block_file="$(mktemp)"
{
  echo "$BEGIN_MARK"
  sed 's#`docs/lessons/log.md`#`~/.claude/lessons/log.md`（リポジトリ内に docs/lessons/log.md があればそちら）#' "$REPO_DIR/CLAUDE.md"
  echo "$END_MARK"
} > "$block_file"

dest_md="$TARGET/CLAUDE.md"
if [[ -f "$dest_md" ]] && grep -qF "$BEGIN_MARK" "$dest_md"; then
  new_md="$(mktemp)"
  awk -v b="$BEGIN_MARK" -v e="$END_MARK" -v blk="$block_file" '
    $0 == b { while ((getline line < blk) > 0) print line; skip = 1; next }
    $0 == e { skip = 0; next }
    !skip { print }
  ' "$dest_md" > "$new_md"
  if cmp -s "$new_md" "$dest_md"; then
    echo "変更なし: $dest_md"
  else
    backup_if_exists "$dest_md"
    run cp "$new_md" "$dest_md"
    echo "更新: $dest_md（目印の範囲のみ）"
  fi
  rm -f "$new_md"
else
  backup_if_exists "$dest_md"
  run mkdir -p "$TARGET"
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] $dest_md の末尾に共通ルールを追加"
  else
    { [[ -s "$dest_md" ]] && echo; cat "$block_file"; } >> "$dest_md"
    echo "追加: $dest_md（既存の内容は残したまま末尾に追加）"
  fi
fi
rm -f "$block_file"

# 4. 学びの記録（なければ作成。既存なら触らない）
if [[ ! -f "$TARGET/lessons/log.md" ]]; then
  run mkdir -p "$TARGET/lessons"
  if [[ $DRY_RUN -eq 0 ]]; then
    head -n 6 "$REPO_DIR/docs/lessons/log.md" > "$TARGET/lessons/log.md"
  fi
  [[ $DRY_RUN -eq 1 ]] && echo "[dry-run] 作成予定: $TARGET/lessons/log.md" || echo "作成: $TARGET/lessons/log.md"
fi

echo "完了。新しいセッションを開くと反映されます。"

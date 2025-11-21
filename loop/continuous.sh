#!/usr/bin/env sh

set -eu

# Số vòng lặp (có thể override bằng biến môi trường ITERATION_COUNT)
ITERATION_COUNT="${ITERATION_COUNT:-50}"

# File prompt (mặc định: loop/prompt.md)
PROMPT_FILE="${1:-loop/prompt.md}"

# File log
LOG_FILE="loop/loop.log"

cleanup() {
  # Nếu sau này bạn muốn làm gì khi thoát thì xử lý ở đây
  :
}

# Trap cho Ctrl+C và exit bình thường
trap 'cleanup; printf "\n[Interrupted]\n" >&2; exit 130' INT
trap 'cleanup' EXIT

# Xoá nội dung log cũ
mkdir -p "$(dirname "$LOG_FILE")"
: > "$LOG_FILE"

run_once() {
  echo ""
  echo "==================== New Claude Run $(date) ====================" | tee -a "$LOG_FILE"

  # Chạy claude với prompt, log ra file + in ra màn hình
  cat "$PROMPT_FILE" \
    | claude -p \
      --verbose \
      --dangerously-skip-permissions \
    | tee -a "$LOG_FILE"

  echo "" | tee -a "$LOG_FILE"
}

i=1
while [ "$i" -le "$ITERATION_COUNT" ]; do
  echo ""
  echo "------------------------------------------------------------"
  echo " Loop iteration $i / $ITERATION_COUNT"
  echo "------------------------------------------------------------"

  run_once

  # Nếu muốn nghỉ 1–2s giữa các lần thì mở comment dòng dưới
  # sleep 2

  i=$((i + 1))
done

echo ""
echo "==================== Loop complete ====================" | tee -a "$LOG_FILE"

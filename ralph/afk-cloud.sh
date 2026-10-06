#!/bin/bash
set -eo pipefail

# Ralph AFK — versión NUBE (Codespace / VM), SIN sbx.
# El contenedor de nube YA es el sandbox (aislado y descartable), así que
# corremos Claude directo con --dangerously-skip-permissions. NO usar esto en
# tu máquina real: solo dentro de un contenedor/VM descartable.

if [ -z "$1" ]; then
  echo "Uso: $0 <iteraciones>"
  exit 1
fi

# Extrae el texto de los mensajes del asistente para verlo en vivo.
stream_text='select(.type == "assistant").message.content[]? | select(.type == "text").text // empty | gsub("\n"; "\r\n") | . + "\r\n\n"'
# Extrae el resultado final (para detectar el promise de fin).
final_result='select(.type == "result").result // empty'

for ((i=1; i<=$1; i++)); do
  tmpfile=$(mktemp)
  trap "rm -f $tmpfile" EXIT

  commits=$(git log -n 5 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No commits found")
  issues=$(gh issue list --state open --label "ready-for-agent" --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]' 2>/dev/null || echo "No issues found")
  prompt=$(cat ralph/prompt.md)

  claude \
    --model claude-sonnet-5 \
    --dangerously-skip-permissions \
    --verbose \
    --print \
    --output-format stream-json \
    "Previous commits: $commits Issues: $issues $prompt" \
  | grep --line-buffered '^{' \
  | tee "$tmpfile" \
  | jq --unbuffered -rj "$stream_text"

  result=$(jq -r "$final_result" "$tmpfile")

  if [[ "$result" == *"<promise>NO MORE TASKS</promise>"* ]]; then
    echo "Ralph completó después de $i iteraciones."
    exit 0
  fi
done

#!/bin/sh
set -eu

shutdown() {
  trap '' TERM INT
  kill -"$1" "$next_pid" "$game_pid" 2>/dev/null || true
  wait "$next_pid" || true
  wait "$game_pid" || true
}

HOSTNAME="${OSV_HOSTNAME:-0.0.0.0}" PORT="${PORT:-3000}" \
  node packages/webapp/server.js &
next_pid="$!"

PORT="${GAME_SERVER_PORT:-3001}" \
  node -r ./packages/webapp/register-dist-alias.js \
  packages/webapp/dist/src/server.js &
game_pid="$!"

trap 'shutdown TERM; exit 0' TERM
trap 'shutdown INT; exit 0' INT

while kill -0 "$next_pid" 2>/dev/null && kill -0 "$game_pid" 2>/dev/null; do
  sleep 5
done

shutdown TERM
exit 1

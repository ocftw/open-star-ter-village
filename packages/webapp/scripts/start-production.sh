#!/bin/sh
set -eu

HOSTNAME="${OSV_HOSTNAME:-0.0.0.0}" PORT="${PORT:-3000}" \
  node packages/webapp/server.js &
next_pid="$!"

PORT="${GAME_SERVER_PORT:-3001}" \
  node -r ./packages/webapp/register-dist-alias.js \
  packages/webapp/dist/src/server.js &
game_pid="$!"

while kill -0 "$next_pid" 2>/dev/null && kill -0 "$game_pid" 2>/dev/null; do
  sleep 5
done

kill "$next_pid" "$game_pid" 2>/dev/null || true
wait || true
exit 1

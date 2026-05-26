---
name: webapp-deploy-smoke-test
description: Run the Open StarTer Village external-network deploy smoke test after Fly.io alpha deployments or when verifying a fork. Use when checking public frontend availability, public game server health, multiplayer WebSocket behavior, reconnect behavior, latency, restart limitations, or UptimeRobot Discord alerting.
---

# Webapp External-Network Deploy Smoke Test

## Overview

Use this workflow after deploying the Fly.io alpha from a real external network.
Do not rely only on localhost, a Fly private network, or logs from inside the
deployment environment.

## Inputs

Confirm these values before running the test:

- Public app origin, for example `https://open-star-ter-village.fly.dev`
- Public game server origin, usually the app origin on port `3001`
- GitHub issue or PR where the run should be recorded
- Whether the user authorizes alert tests or production restarts

## Public Probes

Run these checks from outside Fly.io:

- `GET https://<app>/` returns HTTP 200.
- `GET https://<app>/lobby` returns HTTP 200.
- `GET https://<app>:3001/health` returns HTTP 200 JSON.
- `GET https://<app>:3001/games/OpenStarTerVillage` returns HTTP 200 JSON.

If a check fails, collect the status code, response body, timestamp, and the
network used before moving on.

## Multiplayer Smoke Test

Use browsers or devices from real external networks when available. If three
distinct networks are not available, record the limitation instead of implying
full coverage.

- Phone on cellular opens `https://<app>/lobby` and the page loads.
- Three browsers from different networks create and join a 3-player match.
- Socket.IO handshake succeeds; DevTools Network shows WebSocket frames flowing.
- One client refreshes and reconnects within 5 seconds.
- Move latency is under 300 ms RTT.
- Server restart loses match state, and testers see or receive the documented
  alpha limitation.

Do not restart production or deliberately break a live match unless the user
explicitly authorizes that action.

## UptimeRobot Alert Test

Confirm the three UptimeRobot monitors cover:

- Frontend: `https://<app>/`
- Game server health: `https://<app>:3001/health`
- Game server lobby REST: `https://<app>:3001/games/OpenStarTerVillage`

When the user asks to test notifications, use UptimeRobot's test notification
flow and verify the Discord ops channel receives the alert. Do not expose
webhook URLs, API keys, or other secrets in reports.

## Report Format

Record the result as a GitHub issue or PR comment. Include:

- Run date and timezone
- App URL and game server URL
- Tester networks and browser/device mix
- Pass/fail status for each public probe and gameplay check
- Failures, screenshots, logs, and response snippets
- Whether UptimeRobot Discord notification was verified
- Any untested item and the reason it was skipped

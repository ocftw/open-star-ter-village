# P3 deployment verification — 2026-10-27

Runtime 95691b3e, app https://open-star-ter-village-tree-poc.fly.dev.
Image: registry.fly.io/open-star-ter-village-tree-poc:deployment-01M5Y530EEDH6BECT3DHX3GEGH.

Production image build passed. GET /, /lobby, :3001/health and :3001/games/OpenStarTerVillage returned HTTP 200 from an external network. All five public Playwright scenarios passed in 25.0 seconds: room validation, full 2/3/4-player WebSocket games with privacy/synchronization/reconnect checks, and player browser growth retained after refresh.

This run verifies the deployed workflow, not every event's manual interaction. All-event edge coverage is in the 216-test local suite. One network, desktop Chromium with mobile viewport emulation; separate physical devices/cellular/latency measurements and human P3 acceptance remain unverified. Thresholds, Government 5 targets and rewards unchanged. Deployment restarts lose in-memory matches.

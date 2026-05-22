# External-Network Deploy Smoke Test

Use this checklist after deploying the Fly.io alpha from a real external
network. Do not rely only on localhost or the Fly private network.

- [ ] Phone on cellular hits `https://<app>/lobby` and the page loads.
- [ ] Three browsers from different networks create and join a 3-player match.
- [ ] SocketIO handshake succeeds; DevTools Network shows WebSocket frames flowing.
- [ ] One client refreshes and reconnects within 5 seconds.
- [ ] Move latency is under 300 ms RTT.
- [ ] Server restart loses match state, and testers see or receive the
      documented alpha limitation.
- [ ] `https://<app>/health` returns HTTP 200 JSON from an external probe.
- [ ] UptimeRobot alerts post to Discord `#uptime` when a probe fails.

Record the run date, app URL, tester networks, failures, and screenshots as a
comment on issue #383.

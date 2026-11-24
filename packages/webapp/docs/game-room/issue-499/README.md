# Capture the contribution flow

Serve the production build of the candidate on port 3550 with `ENABLE_DEV_ROUTE=true`. Run this command from `packages/webapp` while the server is running.

```bash
ISSUE_499_SCREENSHOTS="$PWD/docs/game-room/issue-499" pnpm exec playwright test \
  --config docs/game-room/issue-499/capture.config.ts
```

The capture opens `/dev?seed=e2e-2` and reaches both contribution modes using legal START and JOIN moves. Set `PLAYWRIGHT_WEB_PORT` if the production server uses a different port.

Pair the 1280px captures with these local references in the draft PR. Record the candidate SHA with the comparisons.

| Candidate state | Reference |
| --- | --- |
| `active-zero` | Figma 51:518 and prototype 41–42 |
| `pending` | Figma 63:32 and prototype 43, 43b, and 46 |
| `cancelled` | Prototype 44–45 |
| `row-cap-visible` and `row-cap-expired` | Figma 63:32 |
| `action-cap-visible` and `action-cap-expired` | Approved issue 499 wireframe and the Figma 63:32 notice |
| `confirmed` | Prototype 47–48 |
| `joined-pending` and `joined-confirmed` | The matching owned state as a visual reference |

Label the 390px composition proposed and compare it with the same desktop states. Use prototype 84–87 for the mobile shell.

---
name: webapp-incident-response
description: Stabilize, investigate, recover, and document Open StarTer Village webapp production incidents involving Fly.io deployment failures, outages, connection errors, unhealthy probes, high CPU or memory, OOM events, WebSocket failures, Sentry errors, or missed UptimeRobot alerts. Use when production is degraded or the user asks to roll back, inspect logs and metrics, diagnose a bad deployment, restore service, or coordinate incident follow-up.
---

# Webapp Incident Response

Restore user-facing service first, preserve evidence, and separate immediate
mitigation from the durable fix.

## Set the incident boundary

Record:

- start time and timezone;
- affected production URLs and surfaces;
- observed symptoms and reporter evidence;
- current and previous deployed revisions;
- latest deployment or configuration change;
- known user impact; and
- who is coordinating the incident.

Use `Investigating`, `Mitigating`, `Monitoring`, or `Resolved` consistently.
State uncertainty plainly.

## Protect production

- Begin with read-only inspection.
- Ask for explicit authorization before rollback, restart, scaling, secret
  changes, monitor changes, destructive testing, or any other production
  mutation not already requested.
- Prefer rolling back the deployment revision over reverting source history when
  the immediate goal is service restoration.
- Do not expose tokens, webhook URLs, headers, environment values, user data, or
  other secrets in commands or reports.
- Preserve timestamps, deployment IDs, and relevant log excerpts before changing
  state.

## Establish independent symptoms

Check from outside Fly.io:

- frontend page availability and response;
- game server health and lobby REST response;
- WebSocket or multiplayer connectivity when relevant;
- UptimeRobot monitor state and alert delivery; and
- whether impact is global or limited by route, region, client, or role.

Use `../webapp-deploy-smoke-test/SKILL.md` for the full public probe and
multiplayer procedure. A green provider dashboard does not override a failing
external probe.

## Correlate the failure

Build a short timestamped timeline from:

- GitHub deployment workflow and merged revision;
- Fly.io release, machine, allocation, restart, CPU, memory, and OOM state;
- application and proxy logs;
- Sentry events when configured;
- UptimeRobot checks and notification history; and
- configuration or secret changes.

Compare the incident window with a healthy window. Distinguish evidence from
inference, and do not assume the latest merge caused the incident merely because
it preceded it.

## Mitigate

Choose the smallest reversible action that restores service:

1. roll back to the last known healthy deployment;
2. correct a confirmed configuration error;
3. restart or scale only when evidence supports it and the user authorizes it;
4. disable a failing integration or feature when a safe switch exists; or
5. apply a minimal hotfix when rollback cannot restore service.

After every action, rerun the failed external probes and record the exact result.
Stop compounding changes when the symptom is not improving.

## Diagnose the cause

Once service is stable:

1. Reproduce the failure safely outside production when possible.
2. Compare the bad and healthy revisions, runtime configuration, and resource
   behavior.
3. Search upstream provider and dependency documentation only for symptoms
   supported by local evidence.
4. Test competing explanations and identify the evidence that rejects each one.
5. Classify the result as confirmed root cause, contributing factor, or remaining
   hypothesis.

Do not call a resource increase a root-cause fix unless the workload is expected
and the capacity requirement is demonstrated.

## Deliver the durable fix

- Create or update a GitHub incident issue with impact, timeline, evidence,
  mitigation, cause, and follow-up actions.
- Separate the emergency mitigation from durable code, monitoring, and process
  work.
- Use the repository pull request and evidence requirements for every code or
  configuration change.
- Use `../../../../skills/open-star-delivery/SKILL.md` when the user asks to carry
  the fix through merge and deployment.
- Verify the recovered deployment with
  `../webapp-deploy-smoke-test/SKILL.md`.

## Resolve

Mark the incident resolved only when:

- affected public probes and workflows pass;
- the deployed revision is known;
- monitoring remains healthy for an appropriate observation window;
- alerting behavior is verified or its gap is tracked;
- user impact and limitations are documented; and
- every follow-up has an owner or linked issue.

Report the final state as: impact, duration, mitigation, deployed revision,
confirmed cause or remaining hypothesis, verification, monitoring gaps, and
follow-up links.

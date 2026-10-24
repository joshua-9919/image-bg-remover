# Kanban Plan

## READY
- task_id: QA-001
  stage: 09 QA
  skill: student-site-qa-acceptance
  owner: Codex
  input_paths: app/*, components/*, worker.js, scripts/*
  output_paths: docs/orchestrator/launch-gates.md
  gate: core user tasks pass on desktop and mobile
  blocked_if: local browser automation unavailable or production auth cannot be tested
  downstream: 07/08 repair loop
  status: RUNNING

## RUNNING
- task_id: FE-001
  stage: 07 frontend
  skill: frontend-site-automation
  owner: Codex
  input_paths: app/page.tsx, app/pricing/page.tsx, app/blog/page.tsx, components/SiteShell.tsx
  output_paths: code changes
  gate: language does not reset when moving from home to pricing/blog
  blocked_if: none
  downstream: QA-001
  status: DONE_LOCAL

- task_id: BE-001
  stage: 08 backend/data
  skill: backend-auto-site-cloudflare-workers
  owner: Codex
  input_paths: worker.js, app/dashboard/page.tsx
  output_paths: code changes
  gate: public pricing, dashboard, PayPal create-order use same plan IDs
  blocked_if: PayPal live payment credentials not testable
  downstream: QA-001
  status: DONE_LOCAL

## BLOCKED_OWNER
- task_id: OPS-001
  stage: 11 launch
  skill: site-ops-growth-launch
  owner: User
  input_paths: PayPal dashboard, remove-bg provider dashboard, GSC/Bing
  output_paths: launch evidence
  gate: live payment, key rotation, analytics/search console verified
  blocked_if: owner does not confirm external actions
  downstream: 12 data review
  status: BLOCKED


# Incident Response

Date: 2026-05-26 (Quick Links updated 2026-05-27)

## Quick Links

| Resource | URL |
| --- | --- |
| API health | `https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com/health` |
| API base | `https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com` |
| SAM stack (ap-northeast-2) | `https://ap-northeast-2.console.aws.amazon.com/cloudformation/home?region=ap-northeast-2#/stacks/stackinfo?stackId=speakready-my-backend` |
| Lambda function | `https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions` (search `speakready-my-backend`) |
| CloudWatch logs | `https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#logsV2:log-groups$3FlogGroupNameFilter$3Dspeakready-my-backend` |
| CloudWatch alarms | `https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#alarmsV2:` |
| Secrets Manager | `https://ap-northeast-2.console.aws.amazon.com/secretsmanager/listsecrets?region=ap-northeast-2` |
| API Gateway throttling | `https://ap-northeast-2.console.aws.amazon.com/apigateway/main/api-detail?region=ap-northeast-2` |
| Sentry backend | `https://korea-telecom.sentry.io/projects/` (backend project) |
| Sentry frontend | `https://korea-telecom.sentry.io/projects/python-0k/` |
| Supabase project | `https://supabase.com/dashboard/projects` (open the SpeakReadyMY project) |
| Azure Speech | `https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.CognitiveServices%2Faccounts` |
| OpenAI usage | `https://platform.openai.com/usage` |
| EAS builds | `https://expo.dev/accounts/hoik/projects/speakready-my/builds` |
| Deployment runbook | [`docs/deployment-runbook.md`](deployment-runbook.md) |
| Budget plan | [`docs/cost-budget-plan.md`](cost-budget-plan.md) |
| Actual cost log | [`docs/cost-actual-log.md`](cost-actual-log.md) |

## Severity Levels

| Level | Meaning | Initial response |
| --- | --- | --- |
| SEV-1 | App cannot sign in, backend is down, or paid AI calls are failing globally | Stop public rollout, check API Gateway/Lambda health, inspect recent deploys, and post a user-facing notice if applicable. |
| SEV-2 | Core learning flow is degraded, such as recording analysis failures or TTS outage | Keep auth/home available, identify failing provider, and switch affected feature to a friendly retry state. |
| SEV-3 | UI bug, single feature issue, or intermittent provider latency | Log issue, reproduce on dev build, and patch in the next JS update or backend deploy. |

## First 10 Minutes

1. Check `/health` on the deployed API URL.
2. Check CloudWatch Lambda error logs for the latest request IDs.
3. Check CloudWatch alarm state for Lambda `Errors` and high `Duration`.
4. If `SENTRY_DSN` is configured, check the Sentry project for new backend exceptions and traces.
5. Confirm whether the issue is frontend-only by testing the same endpoint with curl or browser export.
6. Check provider dashboards for Azure Speech, OpenAI, Supabase, and AWS API Gateway.
7. Record the incident in this file or a tracker with start time, scope, and suspected cause.

## Provider-Specific Playbooks

| Component | Symptoms | Response |
| --- | --- | --- |
| API Gateway/Lambda | `/health` fails, auth fails, all API calls return 5xx | Check latest SAM deploy, Lambda concurrency/errors, env vars, and database connectivity. Roll back or redeploy the previous known-good template if needed. |
| Sentry backend monitoring | Expected errors do not appear in Sentry | Confirm `SENTRY_DSN` is set in Secrets Manager, Lambda has `SENTRY_TRACES_SAMPLE_RATE`, and the latest Lambda package includes `sentry-sdk`. Use the token-protected `/api/v1/ops/sentry-test` endpoint only for controlled probes. |
| Supabase PostgreSQL | Auth or session save fails, cold starts hang | Check pooler URL, DB status, connection limit, and advisory-lock startup logs. |
| Azure Speech | Pronunciation analysis returns 5xx/timeout | Keep recording retry UI visible, verify region/key, inspect audio conversion logs, and test one known WAV sample. |
| OpenAI feedback | Feedback generation fails after Azure score succeeds | Save pronunciation session if possible, show retry, check OpenAI status, and consider temporary shorter feedback prompts. |
| OpenAI TTS/Supabase Storage | `듣기` fails or cache URL fails | Retry TTS generation, check storage bucket permissions, and fall back to text-only guidance. |

## Rollback Notes

- Backend rollback: redeploy the previous SAM template/build artifact or revert the last backend change and run `sam deploy`.
- Frontend JS rollback: restart Metro from a known-good commit for dev-client testing. For production, publish a corrective update through the chosen Expo release channel once configured.
- Native rollback: install the previous EAS build artifact if a native dependency or app config change caused the issue.

## Communication Template

```text
Status: Investigating / Mitigated / Resolved
Impact:
Started:
Affected flow:
Current workaround:
Next update:
```

## Post-Incident Checklist

| Status | Item |
| --- | --- |
| ☐ | Root cause recorded |
| ☐ | User impact window recorded |
| ☐ | Cost impact checked |
| ☐ | Regression test added or checklist updated |
| ☐ | Runbook updated if the fix changed operations |

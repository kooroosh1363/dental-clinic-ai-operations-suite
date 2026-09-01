# Test report — version 1.0.0

Date: 2026-09-01

## Automated result

| Gate                           | Result                    |
| ------------------------------ | ------------------------- |
| Test files                     | 8 passed / 8              |
| Automated checks               | 212 passed / 212          |
| Statements                     | 95.21%                    |
| Lines                          | 95.21%                    |
| Branches                       | 86.32%                    |
| Functions                      | 86.44%                    |
| Critical domain/services       | 100% statements and lines |
| ESLint                         | Passed                    |
| Strict TypeScript              | Passed                    |
| Production build               | Passed                    |
| High/critical dependency audit | 0 vulnerabilities         |

## Coverage areas

- Shared Zod input boundaries and malicious/invalid variants
- JWT authentication, authorization and protected endpoints
- Public intake, consent and urgent human escalation
- Dashboard timestamp regression and database aggregation
- Patient and appointment API contracts
- No-show score boundaries, weights and explainability
- Administrative message triage
- Approved-source retrieval, citations, unsupported questions and prompt injection
- Human approval permissions and terminal states
- Workflow idempotency, outbox creation, audit events and persisted failures
- Staff login, navigation, searching, appointment creation and sign-out
- Public intake, patients, audit and assistant interactions
- Reusable visual components and status semantics

## Bugs found and fixed during verification

1. Database timestamps could be returned as `Date` objects and caused a dashboard 500 when string slicing was assumed. All timestamps are now normalized before aggregation and a regression test protects the behavior.
2. Newly added UI handlers initially reduced function coverage below the 80% gate. Direct interaction tests were added; the final function coverage is 86.44%.
3. Generated build folders were initially included in lint traversal after a local build. ESLint now ignores generated folders at every workspace depth.

## Open defects

- Critical: 0
- High: 0
- Medium: 0 known in tested scope
- Low: 0 known in tested scope

## Environment limitations

Docker is validated by GitHub Actions because the local authoring environment does not expose Docker. Automated screenshot capture was also unavailable because the local browser binary CDN and the cloud browser-to-localhost bridge were inaccessible. No simulated screenshot is presented as product evidence. Responsive breakpoints and interactions are covered by source review and DOM-level tests; final human cross-browser/accessibility review remains a production-readiness requirement.

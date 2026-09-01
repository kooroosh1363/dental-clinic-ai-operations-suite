# Testing strategy

## Quality model

The test suite favors meaningful behavior over inflated counts. Parameterized cases represent distinct risk combinations, validation boundaries, injection phrases, clinical intent requests and operational scenarios.

| Layer         | Examples                                                       |
| ------------- | -------------------------------------------------------------- |
| Unit          | no-show formula, risk bands, triage signals                    |
| Contract      | intake, login, appointment and agent schemas                   |
| AI evaluation | injection, clinical boundary, grounding, no-source escalation  |
| Integration   | PGlite/PostgreSQL-compatible schema, seed data, audit writes   |
| Workflow      | idempotency, outbox, failure persistence, approval creation    |
| API/security  | auth, roles, body limit, validation, response contracts        |
| Frontend      | login, navigation, API loading, approval, assistant and logout |
| Regression    | database timestamp normalization in dashboard metrics          |

Run:

```bash
npm test
```

Coverage thresholds apply to source code while generated bundles, declaration files and process entrypoints are excluded. Critical domain and service modules target at least 90% coverage.

## Failure scenarios exercised

- malformed or missing intake fields
- missing consent
- unsafe clinical decision request
- prompt injection and private-data request
- unsupported knowledge question
- unauthenticated endpoint access
- insufficient role
- duplicate workflow execution
- missing workflow entity
- failed workflow status persistence
- duplicate notification prevention
- database timestamp representation differences
- empty list rendering
- API and login errors
- mobile navigation structure

## Bug policy

Every confirmed defect receives a reproducing test before or with the fix. A release may not have a known Critical or High issue. Medium and Low issues must be fixed or explicitly documented before review.

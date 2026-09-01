# Production-readiness checklist

This repository is production-oriented but deliberately **not certified or production-approved**. A deployment owner must close each item below.

## Required before real patient use

- [ ] Complete jurisdiction-specific privacy and healthcare legal review.
- [ ] Execute required processor/vendor agreements.
- [ ] Replace demo users, passwords and JWT secret.
- [ ] Use managed PostgreSQL with encryption, backups and restore drills.
- [ ] Define retention, export, correction and deletion procedures.
- [ ] Complete threat modeling, penetration testing and dependency review.
- [ ] Add centralized logs, metrics, alerting and uptime monitoring.
- [ ] Add approved email/SMS provider with consent and opt-out controls.
- [ ] Validate accessibility against WCAG 2.2 AA with human testing.
- [ ] Run clinic user-acceptance tests against actual scheduling policies.
- [ ] Add SSO/MFA, session revocation and environment-specific RBAC.
- [ ] Review every knowledge article and escalation message.
- [ ] Document incident response, recovery objectives and on-call ownership.
- [ ] Perform load, concurrency and disaster-recovery tests.

## Current evidence

- Strict TypeScript, lint and formatting gates
- More than 200 automated checks with enforced coverage thresholds
- API authentication, authorization, validation, rate limiting and security headers
- Deterministic scoring and triage tests
- Agent injection/clinical-boundary evaluations
- Workflow idempotency and failure-state tests
- Container build validation in GitHub Actions

Read `LIMITATIONS.md` before making any production claim.

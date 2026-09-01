# Limitations and production readiness

## Current limitations

- This is a reference implementation with synthetic data, not a live clinical system.
- Administrative keyword routing is intentionally conservative and is not clinical triage.
- The local assistant uses transparent lexical retrieval rather than a hosted generative model.
- Notifications remain dry-run and no real email or SMS is sent.
- No EHR, billing, insurance, payment or identity-provider integration is included.
- Audit storage is append-oriented by application behavior but not protected by an external immutable store.
- JWT logout is client-side; production should support token revocation or short sessions with refresh rotation.
- The demo account is public knowledge and must never be retained outside a demo environment.
- Container execution is validated by CI; local development can run without Docker.

## Trade-offs

| Decision                           | Benefit                                           | Cost                                     |
| ---------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| PGlite fallback                    | Free, reproducible PostgreSQL-like demo           | Not the production deployment target     |
| Deterministic local retrieval      | Explainable and zero-cost                         | Less flexible natural-language synthesis |
| Keyword urgency signals            | Transparent and testable                          | Requires clinic-specific calibration     |
| JWT stateless auth                 | Simple API scaling                                | Revocation requires an added strategy    |
| Outbox pattern                     | Durable, deduplicated message intent              | Needs a production delivery worker       |
| n8n references call controlled API | Visual orchestration without duplicated authority | Requires n8n operations and credentials  |

## Required before a real pilot

Business discovery, clinic owner approval, privacy impact assessment, legal review, real identity provider, environment-specific threat model, provider contracts, monitoring, backup/restore drill, accessibility audit, incident runbook, data retention rules, user training and a limited pilot with rollback criteria.

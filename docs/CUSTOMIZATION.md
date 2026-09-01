# Customization guide

## Brand and clinic configuration

- Replace the fictional NovaSmile name and visual tokens in `apps/web/src/styles.css`.
- Replace seed users and synthetic records in `apps/api/src/seed.ts`.
- Load clinic-approved policies into `knowledge_articles` with review ownership and expiry dates.
- Update services through the shared contract in `packages/shared/src/index.ts`.

## Operational adaptation

Before changing code, map the clinic's actual intake, booking, cancellation, emergency, approval and communication rules. Update deterministic policies first, then decide whether an LLM adds measurable value.

## Model provider

The included assistant works without a paid model. To add a model:

1. Keep injection and clinical-intent gates before the model call.
2. Retrieve approved sources and pass only the minimum necessary context.
3. Require structured output with source IDs and escalation state.
4. Evaluate against the repository's safety corpus.
5. Keep all tools least-privileged and actions behind policy or approval.

## Notifications

The outbox defaults to `dry_run`. A production adapter should claim an outbox item, deliver it once, store provider identifiers, verify webhook signatures, retry transient failures with backoff, and dead-letter permanent failures.

## Multi-clinic extension

Add a `tenant_id` to every operational table, include it in unique constraints, derive it from authenticated membership, enforce it at repository or row-policy level, and add cross-tenant isolation tests before describing the platform as multi-tenant.

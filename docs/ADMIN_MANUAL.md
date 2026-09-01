# Administrator manual

## Configuration

Copy `.env.example` to `.env`. Replace `JWT_SECRET`, demo passwords, allowed web origin and any external database credentials before a shared deployment. Keep `DRY_RUN_NOTIFICATIONS=true` until a reviewed notification adapter is installed.

## Roles

| Role          | Capabilities                                                         |
| ------------- | -------------------------------------------------------------------- |
| Administrator | All staff operations, decision resolution and audit access           |
| Receptionist  | Dashboard, patients, appointments, assistant and approval visibility |
| Dentist       | Contract-defined role reserved for clinic-specific extension         |

Enforcement happens in the API, not only in navigation. Approval resolution and audit access require the administrator role.

## Knowledge management

Approved assistant sources live in the `knowledge_articles` table. Add only reviewed, versioned administrative content. The current local retriever uses transparent token overlap so citations and failure behavior remain inspectable. Do not add clinical diagnosis or treatment directives.

## Workflow operations

The controlled workflow service implements idempotency, run status, audit events, an outbox and failure persistence. Files under `automation/n8n/` are disabled reference imports. Review credentials, callback URLs, retry policy and message templates before enabling them.

## Data operations

- PGlite is appropriate for local demonstration; use managed PostgreSQL for a real multi-user environment.
- Schedule encrypted backups and verify restoration.
- Define retention and deletion rules with legal/privacy counsel.
- Never seed real patient data into a public portfolio deployment.

## Incident procedure

Disable outbound adapters, preserve audit evidence, rotate affected secrets, identify exposed records, follow the clinic's notification policy, and document corrective action. The repository provides primitives, not a substitute for an organizational incident-response program.

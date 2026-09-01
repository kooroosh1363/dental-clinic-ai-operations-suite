# Security and privacy model

## Implemented controls

- JWT authentication with short, configurable expiry
- Role checks for approval resolution and audit access
- Password hashing with bcrypt
- Zod validation and request-body size limit
- Global and login-specific rate limits
- Helmet response headers and restricted CORS origin
- Parameterized SQL queries
- Approved-source retrieval and prompt-injection checks
- Unique workflow and notification idempotency keys
- Synthetic data and dry-run notifications by default
- Audit metadata for login, intake, workflow, appointment, approval and agent actions
- Secrets excluded by `.gitignore` and documented through `.env.example`

## Threats considered

| Threat                      | Control                                 | Remaining concern                                    |
| --------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Credential guessing         | Login rate limit, password hash         | Add MFA and lockout policy in production             |
| Horizontal privilege misuse | Role pre-handlers                       | Add tenant scoping for multi-clinic use              |
| SQL injection               | Parameterized queries, typed validation | Continue query review and SAST                       |
| Stored or reflected XSS     | React escaping, security headers        | Sanitize rich text if later introduced               |
| Prompt injection            | Explicit detection, tool boundaries     | Use layered classifiers and red-team corpus          |
| Hallucinated policy         | Approved-source retrieval or escalation | Add semantic retrieval evaluation and source expiry  |
| Duplicate side effects      | Unique idempotency keys and outbox      | Define retention and replay policy                   |
| Sensitive data leakage      | Synthetic data, minimal answer surface  | Real hosting needs encryption, DLP and access review |

## Real deployment requirements

Regulatory duties depend on jurisdiction, data controller, vendors and workflow. A deployment must add managed secrets, TLS, encrypted backups, key rotation, MFA, dependency scanning, centralized monitoring, incident response, retention/deletion controls, vendor agreements, access review, disaster recovery tests and jurisdiction-specific legal assessment.

Security documentation is not a compliance certificate.

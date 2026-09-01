# API reference

Base URL: `http://localhost:4000`

| Method | Path                     | Access               | Purpose                        |
| ------ | ------------------------ | -------------------- | ------------------------------ |
| GET    | `/health`                | Public               | Service health                 |
| POST   | `/auth/login`            | Public, rate limited | Staff JWT                      |
| POST   | `/public/intake`         | Public               | Validated patient request      |
| GET    | `/dashboard`             | Staff                | Persisted operational metrics  |
| GET    | `/patients`              | Staff                | Recent synthetic patients      |
| GET    | `/appointments`          | Staff                | Schedule and risk scores       |
| POST   | `/appointments`          | Staff                | Create appointment             |
| GET    | `/approvals`             | Staff                | Approval queue                 |
| POST   | `/approvals/:id/resolve` | Admin                | Approve or reject pending item |
| POST   | `/agent/ask`             | Staff                | Grounded operational answer    |
| POST   | `/workflows/:name/run`   | Staff                | Idempotent controlled workflow |
| GET    | `/audit`                 | Admin                | Recent audit history           |

Error responses use a stable `{ "error": "..." }` envelope. Validation failures include `details`. Internal errors do not expose stack traces or database messages.

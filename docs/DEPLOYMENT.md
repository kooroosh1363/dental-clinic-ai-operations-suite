# Deployment guide

## Local zero-cost mode

```bash
npm install
cp .env.example .env
npm run dev
```

This uses embedded PGlite when `DATABASE_URL` is empty.

## Container mode

```bash
docker compose up --build
```

The compose stack starts PostgreSQL 16, the Fastify API and the Nginx-served web app. The API waits for the database health check; the web service waits for API health.

## Production checklist

- Replace demo accounts and every secret.
- Serve web and API behind TLS on approved domains.
- Restrict CORS to the real web origin.
- Use managed secret storage, not an `.env` file in the image.
- Run migrations through a controlled release job.
- Configure encrypted backup and verified restore procedures.
- Add log redaction, metrics, traces and alerts.
- Replace dry-run notifications with an approved provider and signed webhooks.
- Add MFA, account lifecycle, access review and audit retention.
- Perform accessibility, penetration, privacy and legal review.
- Run a small-user pilot before broader rollout.

## Environment variables

| Name                    | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `PORT`                  | API listen port                                   |
| `WEB_ORIGIN`            | Allowed browser origin                            |
| `JWT_SECRET`            | Token-signing secret, minimum 32 characters       |
| `DATABASE_URL`          | External PostgreSQL connection; empty uses PGlite |
| `PGLITE_DATA_DIR`       | Embedded database directory                       |
| `VITE_API_URL`          | Browser-visible API URL                           |
| `DRY_RUN_NOTIFICATIONS` | Keeps outbound messages non-deliverable           |
| `AI_PROVIDER`           | Reserved provider selection                       |
| `AI_BASE_URL`           | Optional OpenAI-compatible or Ollama endpoint     |
| `AI_MODEL`              | Optional configured model                         |

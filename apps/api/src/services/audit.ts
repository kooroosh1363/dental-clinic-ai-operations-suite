import { randomUUID } from "node:crypto";
import type { Database } from "../db/database.js";

export async function audit(
  db: Database,
  input: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  await db.query(
    `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail_json)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      randomUUID(),
      input.actorId ?? null,
      input.action,
      input.entityType,
      input.entityId,
      JSON.stringify(input.detail ?? {}),
    ],
  );
}

import { randomUUID } from "node:crypto";
import type { Database } from "../db/database.js";
import { audit } from "./audit.js";

export type WorkflowName =
  "appointment-reminder" | "high-risk-follow-up" | "intake-human-escalation";

export async function runWorkflow(
  db: Database,
  input: {
    name: WorkflowName;
    entityId: string;
    idempotencyKey: string;
    actorId?: string;
  },
): Promise<{
  runId: string;
  status: "completed" | "deduplicated";
  notificationId?: string;
}> {
  const existing = await db.query<{ id: string }>(
    "SELECT id FROM workflow_runs WHERE idempotency_key = $1",
    [input.idempotencyKey],
  );
  if (existing.rows[0])
    return { runId: existing.rows[0].id, status: "deduplicated" };

  const runId = randomUUID();
  await db.query(
    `INSERT INTO workflow_runs (id, workflow_name, entity_id, idempotency_key, status)
     VALUES ($1, $2, $3, $4, 'running')`,
    [runId, input.name, input.entityId, input.idempotencyKey],
  );

  try {
    let notificationId: string | undefined;
    if (
      input.name === "appointment-reminder" ||
      input.name === "high-risk-follow-up"
    ) {
      const result = await db.query<{
        patient_id: string;
        full_name: string;
        starts_at: string;
      }>(
        `SELECT a.patient_id, p.full_name, a.starts_at
         FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = $1`,
        [input.entityId],
      );
      const appointment = result.rows[0];
      if (!appointment) throw new Error("Appointment not found");
      notificationId = randomUUID();
      await db.query(
        `INSERT INTO notification_outbox (id, patient_id, channel, template, payload_json, status, idempotency_key)
         VALUES ($1, $2, 'email', $3, $4::jsonb, 'dry_run', $5)`,
        [
          notificationId,
          appointment.patient_id,
          input.name,
          JSON.stringify(appointment),
          `notification:${input.idempotencyKey}`,
        ],
      );
    } else {
      const approvalId = randomUUID();
      await db.query(
        `INSERT INTO approvals (id, kind, entity_id, summary, status, requested_by)
         VALUES ($1, 'intake_escalation', $2, 'Potential urgent dental request - staff review required', 'pending', 'workflow')`,
        [approvalId, input.entityId],
      );
    }
    await db.query(
      "UPDATE workflow_runs SET status = 'completed', updated_at = NOW() WHERE id = $1",
      [runId],
    );
    await audit(db, {
      ...(input.actorId ? { actorId: input.actorId } : {}),
      action: "workflow.completed",
      entityType: "workflow_run",
      entityId: runId,
      detail: { name: input.name },
    });
    return {
      runId,
      status: "completed",
      ...(notificationId ? { notificationId } : {}),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown workflow error";
    await db.query(
      "UPDATE workflow_runs SET status = 'failed', error = $2, updated_at = NOW() WHERE id = $1",
      [runId, message],
    );
    throw error;
  }
}

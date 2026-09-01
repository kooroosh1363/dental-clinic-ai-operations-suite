import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase, type Database } from "../db/database.js";
import { seedDatabase } from "../seed.js";
import { runWorkflow } from "./workflows.js";

let db: Database;
beforeEach(async () => {
  db = await createDatabase(undefined, "memory://");
  await seedDatabase(db);
});

describe("workflow orchestration", () => {
  it("creates reminder outbox entry", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    const result = await runWorkflow(db, {
      name: "appointment-reminder",
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:001",
    });
    expect(result.status).toBe("completed");
    expect(result.notificationId).toBeTruthy();
  });
  it("deduplicates same reminder", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    const input = {
      name: "appointment-reminder" as const,
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:002",
    };
    await runWorkflow(db, input);
    expect((await runWorkflow(db, input)).status).toBe("deduplicated");
  });
  it("creates one notification for duplicate calls", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    const input = {
      name: "appointment-reminder" as const,
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:003",
    };
    await runWorkflow(db, input);
    await runWorkflow(db, input);
    const n = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text count FROM notification_outbox WHERE idempotency_key=$1",
      ["notification:reminder:test:003"],
    );
    expect(Number(n.rows[0]!.count)).toBe(1);
  });
  it("creates high-risk follow-up", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    expect(
      (
        await runWorkflow(db, {
          name: "high-risk-follow-up",
          entityId: a.rows[0]!.id,
          idempotencyKey: "risk:test:001",
        })
      ).status,
    ).toBe("completed");
  });
  it("creates human approval for urgent intake", async () => {
    const entityId = crypto.randomUUID();
    await runWorkflow(db, {
      name: "intake-human-escalation",
      entityId,
      idempotencyKey: "intake:test:001",
    });
    const x = await db.query<{ status: string }>(
      "SELECT status FROM approvals WHERE entity_id=$1",
      [entityId],
    );
    expect(x.rows[0]?.status).toBe("pending");
  });
  it("records completed run", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    const result = await runWorkflow(db, {
      name: "appointment-reminder",
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:004",
    });
    const run = await db.query<{ status: string }>(
      "SELECT status FROM workflow_runs WHERE id=$1",
      [result.runId],
    );
    expect(run.rows[0]?.status).toBe("completed");
  });
  it("records audit entry", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    const result = await runWorkflow(db, {
      name: "appointment-reminder",
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:005",
    });
    const log = await db.query<{ action: string }>(
      "SELECT action FROM audit_logs WHERE entity_id=$1",
      [result.runId],
    );
    expect(log.rows[0]?.action).toBe("workflow.completed");
  });
  it("records actor when supplied", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    const u = await db.query<{ id: string }>("SELECT id FROM users LIMIT 1");
    const result = await runWorkflow(db, {
      name: "appointment-reminder",
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:006",
      actorId: u.rows[0]!.id,
    });
    const log = await db.query<{ actor_id: string }>(
      "SELECT actor_id FROM audit_logs WHERE entity_id=$1",
      [result.runId],
    );
    expect(log.rows[0]?.actor_id).toBe(u.rows[0]!.id);
  });
  it("fails missing appointment", async () => {
    await expect(
      runWorkflow(db, {
        name: "appointment-reminder",
        entityId: crypto.randomUUID(),
        idempotencyKey: "missing:test:001",
      }),
    ).rejects.toThrow("Appointment not found");
  });
  it("persists failed status", async () => {
    try {
      await runWorkflow(db, {
        name: "appointment-reminder",
        entityId: crypto.randomUUID(),
        idempotencyKey: "missing:test:002",
      });
    } catch {
      // The persisted failure state is the subject of this test.
    }
    const run = await db.query<{ status: string; error: string }>(
      "SELECT status,error FROM workflow_runs WHERE idempotency_key=$1",
      ["missing:test:002"],
    );
    expect(run.rows[0]?.status).toBe("failed");
    expect(run.rows[0]?.error).toContain("not found");
  });
  it("uses dry-run notification status", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    await runWorkflow(db, {
      name: "appointment-reminder",
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:007",
    });
    const n = await db.query<{ status: string }>(
      "SELECT status FROM notification_outbox WHERE idempotency_key=$1",
      ["notification:reminder:test:007"],
    );
    expect(n.rows[0]?.status).toBe("dry_run");
  });
  it("uses email channel", async () => {
    const a = await db.query<{ id: string }>(
      "SELECT id FROM appointments LIMIT 1",
    );
    await runWorkflow(db, {
      name: "appointment-reminder",
      entityId: a.rows[0]!.id,
      idempotencyKey: "reminder:test:008",
    });
    const n = await db.query<{ channel: string }>(
      "SELECT channel FROM notification_outbox WHERE idempotency_key=$1",
      ["notification:reminder:test:008"],
    );
    expect(n.rows[0]?.channel).toBe("email");
  });
});

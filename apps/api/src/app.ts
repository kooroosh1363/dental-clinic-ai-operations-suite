import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import bcrypt from "bcryptjs";
import {
  agentQuestionSchema,
  appointmentSchema,
  intakeSchema,
  loginSchema,
} from "@novasmile/shared";
import type { AppConfig } from "./config.js";
import type { Database } from "./db/database.js";
import { calculateNoShowScore } from "./domain/noShowScore.js";
import { triageAdministrativeMessage } from "./domain/triage.js";
import { answerClinicQuestion } from "./services/agent.js";
import { audit } from "./services/audit.js";
import { runWorkflow, type WorkflowName } from "./services/workflows.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: { sub: string; role: string; email: string };
  }
}

const workflowNames = new Set<WorkflowName>([
  "appointment-reminder",
  "high-risk-follow-up",
  "intake-human-escalation",
]);

export function buildApp(db: Database, config: AppConfig): FastifyInstance {
  const app = Fastify({
    logger: config.NODE_ENV !== "test",
    bodyLimit: 1_000_000,
  });
  app.register(cors, { origin: config.WEB_ORIGIN, credentials: false });
  app.register(helmet, { contentSecurityPolicy: false });
  app.register(jwt, { secret: config.JWT_SECRET });
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  const authenticate = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  };
  const requireAdmin = async (request: any, reply: any) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    if (request.user.role !== "admin")
      return reply.code(403).send({ error: "Admin role required" });
  };

  app.setErrorHandler((error: any, _request, reply) => {
    if (error && "issues" in error)
      return reply
        .code(400)
        .send({ error: "Validation failed", details: error.issues });
    const status =
      error?.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return reply.code(status).send({
      error:
        status === 500
          ? "Internal server error"
          : String(error?.message ?? "Request failed"),
    });
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "novasmile-api",
    timestamp: new Date().toISOString(),
  }));

  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const result = await db.query<{
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: string;
      }>(
        "SELECT id,email,password_hash,full_name,role FROM users WHERE LOWER(email) = LOWER($1)",
        [input.email],
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(input.password, user.password_hash)))
        return reply.code(401).send({ error: "Invalid email or password" });
      const token = app.jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: "8h" },
      );
      await audit(db, {
        actorId: user.id,
        action: "auth.login",
        entityType: "user",
        entityId: user.id,
      });
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      };
    },
  );

  app.post("/public/intake", async (request, reply) => {
    const input = intakeSchema.parse(request.body);
    const triage = triageAdministrativeMessage(input.message);
    const patientId = randomUUID();
    const intakeId = randomUUID();
    await db.query(
      "INSERT INTO patients (id,full_name,email,phone,consent_at) VALUES ($1,$2,$3,$4,NOW())",
      [patientId, input.fullName, input.email, input.phone],
    );
    await db.query(
      `INSERT INTO intake_requests (id,patient_id,service,preferred_date,message,urgency,status)
       VALUES ($1,$2,$3,$4,$5,$6,'received')`,
      [
        intakeId,
        patientId,
        input.service,
        input.preferredDate,
        input.message,
        triage.urgency,
      ],
    );
    await audit(db, {
      action: "intake.created",
      entityType: "intake_request",
      entityId: intakeId,
      detail: { urgency: triage.urgency },
    });
    if (triage.urgency === "human_review_now") {
      await runWorkflow(db, {
        name: "intake-human-escalation",
        entityId: intakeId,
        idempotencyKey: `intake-escalation:${intakeId}`,
      });
    }
    return reply.code(201).send({ id: intakeId, status: "received", triage });
  });

  app.get("/dashboard", { preHandler: authenticate }, async () => {
    const [appointments, approvals, services] = await Promise.all([
      db.query<{
        starts_at: string | Date;
        status: string;
        no_show_score: number;
      }>("SELECT starts_at,status,no_show_score FROM appointments"),
      db.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM approvals WHERE status='pending'",
      ),
      db.query<{ service: string; count: string }>(
        "SELECT service, COUNT(*)::text AS count FROM appointments GROUP BY service ORDER BY count DESC",
      ),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const confirmed = appointments.rows.filter(
      (a) => a.status === "confirmed",
    ).length;
    const weeklyVolume = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const key = date.toISOString().slice(0, 10);
      return {
        day: date.toLocaleDateString("en-CA", { weekday: "short" }),
        appointments: appointments.rows.filter(
          (a) => new Date(a.starts_at).toISOString().slice(0, 10) === key,
        ).length,
      };
    });
    return {
      todayAppointments: appointments.rows.filter(
        (a) => new Date(a.starts_at).toISOString().slice(0, 10) === today,
      ).length,
      confirmedRate: appointments.rows.length
        ? Math.round((confirmed / appointments.rows.length) * 100)
        : 0,
      pendingApprovals: Number(approvals.rows[0]?.count ?? 0),
      highRiskNoShows: appointments.rows.filter((a) => a.no_show_score >= 60)
        .length,
      weeklyVolume,
      serviceMix: services.rows.map((row) => ({
        service: row.service,
        count: Number(row.count),
      })),
    };
  });

  app.get("/patients", { preHandler: authenticate }, async () => {
    const result = await db.query(
      "SELECT id,full_name,email,phone,created_at FROM patients ORDER BY created_at DESC LIMIT 100",
    );
    return result.rows;
  });

  app.get("/appointments", { preHandler: authenticate }, async () => {
    const result = await db.query(
      `SELECT a.id,a.service,a.starts_at,a.duration_minutes,a.clinician,a.status,a.no_show_score,
              p.full_name AS patient_name,p.id AS patient_id
       FROM appointments a JOIN patients p ON p.id=a.patient_id ORDER BY a.starts_at ASC LIMIT 200`,
    );
    return result.rows;
  });

  app.post(
    "/appointments",
    { preHandler: authenticate },
    async (request, reply) => {
      const input = appointmentSchema.parse(request.body);
      const patient = await db.query<{ id: string }>(
        "SELECT id FROM patients WHERE id=$1",
        [input.patientId],
      );
      if (!patient.rows[0])
        return reply.code(404).send({ error: "Patient not found" });
      const score = calculateNoShowScore({
        previousNoShows: 0,
        daysUntilAppointment: Math.max(
          0,
          Math.ceil(
            (new Date(input.startsAt).getTime() - Date.now()) / 86_400_000,
          ),
        ),
        confirmed: false,
        reminderDelivered: false,
        isNewPatient: true,
        appointmentHour: new Date(input.startsAt).getHours(),
      });
      const id = randomUUID();
      await db.query(
        `INSERT INTO appointments (id,patient_id,service,starts_at,duration_minutes,clinician,status,notes,no_show_score)
       VALUES ($1,$2,$3,$4,$5,$6,'scheduled',$7,$8)`,
        [
          id,
          input.patientId,
          input.service,
          input.startsAt,
          input.durationMinutes,
          input.clinician,
          input.notes,
          score.score,
        ],
      );
      await audit(db, {
        actorId: request.user.sub,
        action: "appointment.created",
        entityType: "appointment",
        entityId: id,
        detail: { noShowBand: score.band },
      });
      return reply
        .code(201)
        .send({ id, ...input, status: "scheduled", noShow: score });
    },
  );

  app.get("/approvals", { preHandler: authenticate }, async () => {
    const result = await db.query(
      "SELECT * FROM approvals ORDER BY created_at DESC LIMIT 100",
    );
    return result.rows;
  });

  app.post(
    "/approvals/:id/resolve",
    { preHandler: requireAdmin },
    async (request: any, reply) => {
      const status = (request.body as any)?.status;
      if (!["approved", "rejected"].includes(status))
        return reply
          .code(400)
          .send({ error: "Status must be approved or rejected" });
      const result = await db.query<{ id: string }>(
        `UPDATE approvals SET status=$2,resolved_by=$3,resolved_at=NOW()
       WHERE id=$1 AND status='pending' RETURNING id`,
        [request.params.id, status, request.user.sub],
      );
      if (!result.rows[0])
        return reply.code(404).send({ error: "Pending approval not found" });
      await audit(db, {
        actorId: request.user.sub,
        action: `approval.${status}`,
        entityType: "approval",
        entityId: request.params.id,
      });
      return { id: request.params.id, status };
    },
  );

  app.post("/agent/ask", { preHandler: authenticate }, async (request) => {
    const input = agentQuestionSchema.parse(request.body);
    const answer = await answerClinicQuestion(db, input.question);
    await audit(db, {
      actorId: request.user.sub,
      action: "agent.answered",
      entityType: "agent_session",
      entityId: input.sessionId,
      detail: {
        grounded: answer.grounded,
        escalated: answer.escalated,
        reason: answer.reason,
      },
    });
    return answer;
  });

  app.post(
    "/workflows/:name/run",
    { preHandler: authenticate },
    async (request: any, reply) => {
      const name = request.params.name as WorkflowName;
      if (!workflowNames.has(name))
        return reply.code(404).send({ error: "Unknown workflow" });
      const entityId = String(request.body?.entityId ?? "");
      const idempotencyKey = String(request.body?.idempotencyKey ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(entityId) || idempotencyKey.length < 8)
        return reply
          .code(400)
          .send({ error: "Valid entityId and idempotencyKey are required" });
      return runWorkflow(db, {
        name,
        entityId,
        idempotencyKey,
        actorId: request.user.sub,
      });
    },
  );

  app.get("/audit", { preHandler: requireAdmin }, async () => {
    const result = await db.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100",
    );
    return result.rows;
  });

  return app;
}

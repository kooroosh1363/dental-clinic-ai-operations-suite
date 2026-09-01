import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Database } from "./db/database.js";

export async function seedDatabase(db: Database): Promise<void> {
  const existing = await db.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM users",
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;

  const adminId = randomUUID();
  const receptionistId = randomUUID();
  const passwordHash = await bcrypt.hash("DemoClinic!2026", 10);
  await db.query(
    `INSERT INTO users (id,email,password_hash,full_name,role) VALUES
     ($1,'admin@novasmile.demo',$3,'Maya Chen','admin'),
     ($2,'reception@novasmile.demo',$3,'Sofia Patel','receptionist')`,
    [adminId, receptionistId, passwordHash],
  );

  const knowledge = [
    [
      "Office hours",
      "NovaSmile is open Monday to Friday from 8:00 AM to 6:00 PM and Saturday from 9:00 AM to 2:00 PM.",
    ],
    [
      "Appointment changes",
      "Appointments can be changed by contacting reception at least 24 hours before the scheduled time.",
    ],
    [
      "New patient visit",
      "New patients should arrive 15 minutes early and bring identification, insurance information, and a current medication list.",
    ],
    [
      "Emergency limitations",
      "For severe swelling, uncontrolled bleeding, difficulty breathing, or facial trauma, contact emergency services. The assistant cannot assess emergencies.",
    ],
    [
      "Payment policy",
      "The clinic accepts major cards and provides written estimates after clinical assessment. Estimates require staff approval.",
    ],
  ];
  for (const [title, content] of knowledge) {
    await db.query(
      "INSERT INTO knowledge_articles (id,title,content,approved) VALUES ($1,$2,$3,TRUE)",
      [randomUUID(), title, content],
    );
  }

  const patients = [
    ["Olivia Martin", "olivia@example.test", "+1 604 555 0101"],
    ["Ethan Lee", "ethan@example.test", "+1 604 555 0102"],
    ["Amelia Wilson", "amelia@example.test", "+1 604 555 0103"],
    ["Noah Brown", "noah@example.test", "+1 604 555 0104"],
    ["Ava Garcia", "ava@example.test", "+1 604 555 0105"],
  ];
  const patientIds: string[] = [];
  for (const patient of patients) {
    const id = randomUUID();
    patientIds.push(id);
    await db.query(
      "INSERT INTO patients (id,full_name,email,phone,consent_at) VALUES ($1,$2,$3,$4,NOW())",
      [id, ...patient],
    );
  }
  const now = new Date();
  for (let index = 0; index < 8; index += 1) {
    const id = randomUUID();
    const starts = new Date(now);
    starts.setDate(now.getDate() + (index % 6));
    starts.setHours(9 + index, 0, 0, 0);
    await db.query(
      `INSERT INTO appointments (id,patient_id,service,starts_at,duration_minutes,clinician,status,no_show_score)
       VALUES ($1,$2,$3,$4,45,'Dr. Rivera',$5,$6)`,
      [
        id,
        patientIds[index % patientIds.length],
        index % 2 ? "Cleaning" : "Filling",
        starts.toISOString(),
        index % 3 ? "confirmed" : "scheduled",
        index * 11,
      ],
    );
  }
  await db.query(
    `INSERT INTO approvals (id,kind,entity_id,summary,status,requested_by) VALUES
     ($1,'estimate', $2, 'Review crown consultation estimate before sending', 'pending','proposal-agent'),
     ($3,'urgent_intake', $4, 'Review possible facial swelling report', 'pending','intake-workflow')`,
    [randomUUID(), patientIds[0], randomUUID(), patientIds[2]],
  );
}

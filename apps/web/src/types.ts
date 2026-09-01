import type { DashboardSummary } from "@novasmile/shared";
export type { DashboardSummary };

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}
export interface Appointment {
  id: string;
  service: string;
  starts_at: string;
  duration_minutes: number;
  clinician: string;
  status: string;
  no_show_score: number;
  patient_name: string;
  patient_id: string;
}
export interface Approval {
  id: string;
  kind: string;
  summary: string;
  status: string;
  requested_by: string;
  created_at: string;
}
export interface AgentAnswer {
  answer: string;
  citations: Array<{ id: string; title: string }>;
  grounded: boolean;
  escalated: boolean;
  reason?: string;
}
export interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}
export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id?: string;
  detail: Record<string, unknown>;
  created_at: string;
}

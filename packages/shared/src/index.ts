import { z } from "zod";

export const roles = ["admin", "receptionist", "dentist"] as const;
export type Role = (typeof roles)[number];

export const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const services = [
  "Cleaning",
  "Emergency exam",
  "Filling",
  "Root canal consult",
  "Crown consult",
  "Whitening",
] as const;
export type DentalService = (typeof services)[number];

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const intakeSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/),
  service: z.enum(services),
  preferredDate: z.string().date(),
  message: z.string().trim().min(3).max(1000),
  consent: z.literal(true),
});

export const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  service: z.enum(services),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(240),
  clinician: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(1000).default(""),
});

export const agentQuestionSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  sessionId: z.string().trim().min(6).max(100),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;

export interface DashboardSummary {
  todayAppointments: number;
  confirmedRate: number;
  pendingApprovals: number;
  highRiskNoShows: number;
  weeklyVolume: Array<{ day: string; appointments: number }>;
  serviceMix: Array<{ service: string; count: number }>;
}

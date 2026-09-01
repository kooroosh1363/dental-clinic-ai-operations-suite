import { describe, expect, it } from "vitest";
import {
  agentQuestionSchema,
  appointmentSchema,
  intakeSchema,
  loginSchema,
  services,
} from "./index.js";

const validIntake = {
  fullName: "Ava Stone",
  email: "ava@example.test",
  phone: "+1 604 555 0123",
  service: "Cleaning",
  preferredDate: "2026-10-12",
  message: "Routine appointment request",
  consent: true,
} as const;
const invalidIntakes: Array<[string, Record<string, unknown>]> = [
  ["short name", { fullName: "A" }],
  ["long name", { fullName: "x".repeat(101) }],
  ["bad email", { email: "not-mail" }],
  ["long email", { email: `${"a".repeat(250)}@x.test` }],
  ["short phone", { phone: "123" }],
  ["letters in phone", { phone: "CALL-ME-NOW" }],
  ["unknown service", { service: "Surgery" }],
  ["bad date", { preferredDate: "12/10/2026" }],
  ["empty message", { message: "" }],
  ["short message", { message: "ok" }],
  ["long message", { message: "x".repeat(1001) }],
  ["no consent", { consent: false }],
  ["missing name", { fullName: undefined }],
  ["missing email", { email: undefined }],
  ["missing phone", { phone: undefined }],
  ["missing service", { service: undefined }],
  ["missing date", { preferredDate: undefined }],
  ["missing message", { message: undefined }],
  ["missing consent", { consent: undefined }],
  ["null body", { fullName: null }],
];
describe("shared validation contracts", () => {
  it("accepts a valid intake", () =>
    expect(intakeSchema.safeParse(validIntake).success).toBe(true));
  it.each(invalidIntakes)("rejects intake: %s", (_n, change) =>
    expect(intakeSchema.safeParse({ ...validIntake, ...change }).success).toBe(
      false,
    ),
  );
  it.each(services)("accepts supported service %s", (service) =>
    expect(intakeSchema.safeParse({ ...validIntake, service }).success).toBe(
      true,
    ),
  );
  it("trims intake names", () =>
    expect(
      intakeSchema.parse({ ...validIntake, fullName: "  Ava Stone  " })
        .fullName,
    ).toBe("Ava Stone"));
  it("accepts valid login", () =>
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "12345678" }).success,
    ).toBe(true));
  it("rejects short login password", () =>
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "123" }).success,
    ).toBe(false));
  it("rejects malformed login email", () =>
    expect(
      loginSchema.safeParse({ email: "abc", password: "12345678" }).success,
    ).toBe(false));
  it("rejects excessive login password", () =>
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x".repeat(129) })
        .success,
    ).toBe(false));
  it("accepts valid agent question", () =>
    expect(
      agentQuestionSchema.safeParse({
        question: "What time do you open?",
        sessionId: "session-1",
      }).success,
    ).toBe(true));
  it("rejects short agent question", () =>
    expect(
      agentQuestionSchema.safeParse({ question: "hi", sessionId: "session-1" })
        .success,
    ).toBe(false));
  it("rejects short session id", () =>
    expect(
      agentQuestionSchema.safeParse({ question: "What time?", sessionId: "x" })
        .success,
    ).toBe(false));
  it("accepts a valid appointment", () =>
    expect(
      appointmentSchema.safeParse({
        patientId: "123e4567-e89b-12d3-a456-426614174000",
        service: "Filling",
        startsAt: "2026-10-12T10:00:00.000Z",
        durationMinutes: 45,
        clinician: "Dr. Rivera",
        notes: "",
      }).success,
    ).toBe(true));
  it("rejects invalid patient uuid", () =>
    expect(
      appointmentSchema.safeParse({
        patientId: "x",
        service: "Filling",
        startsAt: "2026-10-12T10:00:00.000Z",
        durationMinutes: 45,
        clinician: "Dr. Rivera",
      }).success,
    ).toBe(false));
  it("rejects too-short duration", () =>
    expect(
      appointmentSchema.safeParse({
        patientId: "123e4567-e89b-12d3-a456-426614174000",
        service: "Filling",
        startsAt: "2026-10-12T10:00:00.000Z",
        durationMinutes: 5,
        clinician: "Dr. Rivera",
      }).success,
    ).toBe(false));
  it("rejects too-long duration", () =>
    expect(
      appointmentSchema.safeParse({
        patientId: "123e4567-e89b-12d3-a456-426614174000",
        service: "Filling",
        startsAt: "2026-10-12T10:00:00.000Z",
        durationMinutes: 300,
        clinician: "Dr. Rivera",
      }).success,
    ).toBe(false));
});

const emergencySignals = [
  "swelling",
  "uncontrolled bleeding",
  "difficulty breathing",
  "facial trauma",
];
const urgentSignals = [
  "severe pain",
  "broken tooth",
  "lost filling",
  "infection",
  "fever",
];

export type Urgency = "routine" | "priority" | "human_review_now";

export function triageAdministrativeMessage(message: string): {
  urgency: Urgency;
  matchedSignals: string[];
  disclaimer: string;
} {
  const normalized = message.toLowerCase();
  const emergencies = emergencySignals.filter((signal) =>
    normalized.includes(signal),
  );
  const urgent = urgentSignals.filter((signal) => normalized.includes(signal));
  const urgency: Urgency = emergencies.length
    ? "human_review_now"
    : urgent.length
      ? "priority"
      : "routine";
  return {
    urgency,
    matchedSignals: [...emergencies, ...urgent],
    disclaimer:
      "Administrative triage only. This system does not diagnose or recommend treatment.",
  };
}

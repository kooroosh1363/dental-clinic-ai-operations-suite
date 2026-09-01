export interface NoShowFactors {
  previousNoShows: number;
  daysUntilAppointment: number;
  confirmed: boolean;
  reminderDelivered: boolean;
  isNewPatient: boolean;
  appointmentHour: number;
}

export interface NoShowResult {
  score: number;
  band: "low" | "medium" | "high";
  reasons: string[];
}

export function calculateNoShowScore(input: NoShowFactors): NoShowResult {
  let score = 5;
  const reasons: string[] = [];
  const previous = Math.max(0, Math.min(input.previousNoShows, 5));
  if (previous > 0) {
    score += previous * 16;
    reasons.push(`${previous} previous no-show(s)`);
  }
  if (!input.confirmed) {
    score += 20;
    reasons.push("appointment not confirmed");
  }
  if (!input.reminderDelivered) {
    score += 12;
    reasons.push("reminder not delivered");
  }
  if (input.isNewPatient) {
    score += 7;
    reasons.push("new patient");
  }
  if (input.daysUntilAppointment > 30) {
    score += 10;
    reasons.push("booked more than 30 days ahead");
  } else if (input.daysUntilAppointment > 14) {
    score += 5;
    reasons.push("booked more than 14 days ahead");
  }
  if (input.appointmentHour < 9 || input.appointmentHour >= 17) {
    score += 5;
    reasons.push("edge-of-day appointment");
  }
  score = Math.max(0, Math.min(Math.round(score), 100));
  const band = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, band, reasons };
}

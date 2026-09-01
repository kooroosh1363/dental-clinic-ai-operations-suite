import { describe, expect, it } from "vitest";
import { calculateNoShowScore, type NoShowFactors } from "./noShowScore.js";

const base: NoShowFactors = {
  previousNoShows: 0,
  daysUntilAppointment: 3,
  confirmed: true,
  reminderDelivered: true,
  isNewPatient: false,
  appointmentHour: 10,
};

const table: Array<[string, Partial<NoShowFactors>, number, string]> = [
  ["baseline", {}, 5, "low"],
  ["one previous no-show", { previousNoShows: 1 }, 21, "low"],
  ["two previous no-shows", { previousNoShows: 2 }, 37, "medium"],
  ["three previous no-shows", { previousNoShows: 3 }, 53, "medium"],
  ["four previous no-shows", { previousNoShows: 4 }, 69, "high"],
  ["five previous no-shows", { previousNoShows: 5 }, 85, "high"],
  ["caps previous no-shows", { previousNoShows: 9 }, 85, "high"],
  ["negative history ignored", { previousNoShows: -2 }, 5, "low"],
  ["unconfirmed", { confirmed: false }, 25, "low"],
  ["reminder failed", { reminderDelivered: false }, 17, "low"],
  ["new patient", { isNewPatient: true }, 12, "low"],
  ["31 days ahead", { daysUntilAppointment: 31 }, 15, "low"],
  ["15 days ahead", { daysUntilAppointment: 15 }, 10, "low"],
  ["14 days ahead", { daysUntilAppointment: 14 }, 5, "low"],
  ["early appointment", { appointmentHour: 8 }, 10, "low"],
  ["late appointment", { appointmentHour: 17 }, 10, "low"],
  ["nine is regular", { appointmentHour: 9 }, 5, "low"],
  ["sixteen is regular", { appointmentHour: 16 }, 5, "low"],
  [
    "history and unconfirmed",
    { previousNoShows: 2, confirmed: false },
    57,
    "medium",
  ],
  [
    "history, unconfirmed, no reminder",
    { previousNoShows: 2, confirmed: false, reminderDelivered: false },
    69,
    "high",
  ],
  [
    "all common risks",
    {
      previousNoShows: 1,
      confirmed: false,
      reminderDelivered: false,
      isNewPatient: true,
      daysUntilAppointment: 31,
      appointmentHour: 8,
    },
    75,
    "high",
  ],
  [
    "maximum capped",
    {
      previousNoShows: 99,
      confirmed: false,
      reminderDelivered: false,
      isNewPatient: true,
      daysUntilAppointment: 99,
      appointmentHour: 18,
    },
    100,
    "high",
  ],
  [
    "medium boundary near",
    { previousNoShows: 1, reminderDelivered: false },
    33,
    "medium",
  ],
  [
    "high boundary",
    { previousNoShows: 2, confirmed: false, appointmentHour: 8 },
    62,
    "high",
  ],
  ["day zero", { daysUntilAppointment: 0 }, 5, "low"],
  ["past day", { daysUntilAppointment: -4 }, 5, "low"],
  [
    "new and unconfirmed",
    { isNewPatient: true, confirmed: false },
    32,
    "medium",
  ],
  [
    "new no reminder",
    { isNewPatient: true, reminderDelivered: false },
    24,
    "low",
  ],
  [
    "far new patient",
    { isNewPatient: true, daysUntilAppointment: 40 },
    22,
    "low",
  ],
  [
    "far unconfirmed",
    { confirmed: false, daysUntilAppointment: 40 },
    35,
    "medium",
  ],
  [
    "far no reminder",
    { reminderDelivered: false, daysUntilAppointment: 40 },
    27,
    "low",
  ],
  ["edge new patient", { appointmentHour: 7, isNewPatient: true }, 17, "low"],
  ["edge history", { appointmentHour: 18, previousNoShows: 1 }, 26, "low"],
  ["edge unconfirmed", { appointmentHour: 18, confirmed: false }, 30, "medium"],
  [
    "history far",
    { previousNoShows: 1, daysUntilAppointment: 31 },
    31,
    "medium",
  ],
  [
    "history two far",
    { previousNoShows: 2, daysUntilAppointment: 31 },
    47,
    "medium",
  ],
  [
    "history three far",
    { previousNoShows: 3, daysUntilAppointment: 31 },
    63,
    "high",
  ],
  [
    "history no reminder",
    { previousNoShows: 1, reminderDelivered: false },
    33,
    "medium",
  ],
  ["history new", { previousNoShows: 1, isNewPatient: true }, 28, "low"],
  [
    "history new far",
    { previousNoShows: 1, isNewPatient: true, daysUntilAppointment: 31 },
    38,
    "medium",
  ],
];

describe("calculateNoShowScore", () => {
  it.each(table)("%s", (_name, overrides, score, band) => {
    const result = calculateNoShowScore({ ...base, ...overrides });
    expect(result.score).toBe(score);
    expect(result.band).toBe(band);
  });
  it("returns reasons for every applied risk", () =>
    expect(
      calculateNoShowScore({
        ...base,
        confirmed: false,
        reminderDelivered: false,
      }).reasons,
    ).toHaveLength(2));
  it("returns no reason for baseline", () =>
    expect(calculateNoShowScore(base).reasons).toEqual([]));
  it("never exceeds 100", () =>
    expect(
      calculateNoShowScore({ ...base, previousNoShows: 999, confirmed: false })
        .score,
    ).toBeLessThanOrEqual(100));
  it("never falls below zero", () =>
    expect(
      calculateNoShowScore({ ...base, previousNoShows: -999 }).score,
    ).toBeGreaterThanOrEqual(0));
  it("uses integer scores", () =>
    expect(Number.isInteger(calculateNoShowScore(base).score)).toBe(true));
});

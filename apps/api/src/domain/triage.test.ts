import { describe, expect, it } from "vitest";
import { triageAdministrativeMessage } from "./triage.js";

const cases: Array<[string, string, string, string | undefined]> = [
  [
    "routine cleaning",
    "I would like a cleaning next month",
    "routine",
    undefined,
  ],
  ["routine hours", "What time do you open?", "routine", undefined],
  ["severe pain", "I have severe pain tonight", "priority", "severe pain"],
  ["broken tooth", "I have a broken tooth", "priority", "broken tooth"],
  [
    "lost filling",
    "My lost filling needs attention",
    "priority",
    "lost filling",
  ],
  ["infection", "I am concerned about infection", "priority", "infection"],
  ["fever", "I have pain and fever", "priority", "fever"],
  ["swelling", "There is swelling in my face", "human_review_now", "swelling"],
  [
    "bleeding",
    "I have uncontrolled bleeding",
    "human_review_now",
    "uncontrolled bleeding",
  ],
  [
    "breathing",
    "I have difficulty breathing",
    "human_review_now",
    "difficulty breathing",
  ],
  ["trauma", "There was facial trauma", "human_review_now", "facial trauma"],
  ["case insensitive", "SEVERE PAIN since morning", "priority", "severe pain"],
  [
    "mixed emergency wins",
    "broken tooth and difficulty breathing",
    "human_review_now",
    "difficulty breathing",
  ],
  ["punctuation", "Swelling! Please call.", "human_review_now", "swelling"],
  ["unrelated pain word", "I need an appointment", "routine", undefined],
  ["whitening", "Interested in whitening", "routine", undefined],
  ["crown", "Need a crown consult", "routine", undefined],
  ["reschedule", "Please reschedule me", "routine", undefined],
  ["insurance", "Do you accept insurance?", "routine", undefined],
  ["empty context", "hello clinic", "routine", undefined],
];
describe("administrative triage", () => {
  it.each(cases)("%s", (_n, message, urgency, signal) => {
    const result = triageAdministrativeMessage(message);
    expect(result.urgency).toBe(urgency);
    if (signal) expect(result.matchedSignals).toContain(signal);
    else expect(result.matchedSignals).toHaveLength(0);
  });
  it("always includes a non-diagnostic disclaimer", () =>
    expect(
      triageAdministrativeMessage("hello").disclaimer.toLowerCase(),
    ).toContain("does not diagnose"));
  it("collects multiple signals", () =>
    expect(
      triageAdministrativeMessage("severe pain and fever").matchedSignals,
    ).toEqual(expect.arrayContaining(["severe pain", "fever"])));
  it("emergency remains highest with urgent signal", () =>
    expect(
      triageAdministrativeMessage("swelling and lost filling").urgency,
    ).toBe("human_review_now"));
  it("does not infer symptoms", () =>
    expect(triageAdministrativeMessage("I feel bad").urgency).toBe("routine"));
  it("does not recommend treatment", () =>
    expect(triageAdministrativeMessage("infection").disclaimer).not.toMatch(
      /take|prescribe/i,
    ));
});

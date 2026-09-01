import type { Database } from "../db/database.js";

const prohibitedMedicalIntents = [
  "diagnose",
  "diagnosis",
  "what disease",
  "what medication",
  "prescribe",
  "dosage",
  "should i take",
  "is this cancer",
  "treatment plan",
];

const injectionSignals = [
  "ignore previous instructions",
  "reveal your prompt",
  "system prompt",
  "developer message",
  "dump database",
  "show all patients",
  "bypass policy",
];

export interface AgentAnswer {
  answer: string;
  citations: Array<{ id: string; title: string }>;
  grounded: boolean;
  escalated: boolean;
  reason?: string;
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

export function isPromptInjection(question: string): boolean {
  const normalized = question.toLowerCase();
  return injectionSignals.some((signal) => normalized.includes(signal));
}

export function isMedicalDecisionRequest(question: string): boolean {
  const normalized = question.toLowerCase();
  return prohibitedMedicalIntents.some((intent) => normalized.includes(intent));
}

export async function answerClinicQuestion(
  db: Database,
  question: string,
): Promise<AgentAnswer> {
  if (isPromptInjection(question)) {
    return {
      answer:
        "I cannot follow instructions that request hidden configuration, private data, or policy bypasses.",
      citations: [],
      grounded: false,
      escalated: true,
      reason: "prompt_injection",
    };
  }
  if (isMedicalDecisionRequest(question)) {
    return {
      answer:
        "I can help with appointments and approved clinic information, but a clinician must answer diagnosis or treatment questions.",
      citations: [],
      grounded: false,
      escalated: true,
      reason: "clinical_judgment_required",
    };
  }

  const { rows } = await db.query<{
    id: string;
    title: string;
    content: string;
  }>(
    "SELECT id, title, content FROM knowledge_articles WHERE approved = TRUE ORDER BY version DESC",
  );
  const queryTokens = tokens(question);
  const ranked = rows
    .map((article) => ({
      article,
      score: [...tokens(`${article.title} ${article.content}`)].filter(
        (token) => queryTokens.has(token),
      ).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (!ranked.length) {
    return {
      answer:
        "I do not have an approved clinic source for that question. I can ask the reception team to follow up.",
      citations: [],
      grounded: false,
      escalated: true,
      reason: "no_approved_source",
    };
  }
  const primary = ranked[0]!.article;
  return {
    answer: primary.content,
    citations: ranked.map(({ article }) => ({
      id: article.id,
      title: article.title,
    })),
    grounded: true,
    escalated: false,
  };
}

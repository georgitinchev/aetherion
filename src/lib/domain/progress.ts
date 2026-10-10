import type { Journey, Question, QuizResult, Rank, TrialStatus } from "./types";

export const RANKS: readonly Rank[] = [
  { name: "Youngling", minXp: 0 },
  { name: "Initiate", minXp: 50 },
  { name: "Padawan", minXp: 150 },
  { name: "Knight", minXp: 400 },
  { name: "Master", minXp: 1000 },
  { name: "Grand Master", minXp: 2500 },
];

export const XP_PER_CORRECT = 10;
export const PERFECT_BONUS = 10;
export const PASS_RATIO = 0.6;

export function trialStatus(journey: Journey, index: number): TrialStatus {
  const trial = journey.trials[index];
  if (!trial) return "locked";
  if (trial.completedAt) return "completed";
  if (index === 0 || journey.trials[index - 1]?.completedAt) return "available";
  return "locked";
}

export function journeyXp(journey: Journey): number {
  return journey.trials.reduce((sum, t) => sum + (t.xpEarned ?? 0), 0);
}

export function totalXp(journeys: readonly Journey[]): number {
  return journeys.reduce((sum, j) => sum + journeyXp(j), 0);
}

export function completedCount(journey: Journey): number {
  return journey.trials.filter((t) => t.completedAt).length;
}

export function rankFor(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.minXp) current = rank;
  return current;
}

export function nextRank(xp: number): Rank | null {
  return RANKS.find((r) => r.minXp > xp) ?? null;
}

/** 0..1 progress from the current rank towards the next one. */
export function rankProgress(xp: number): number {
  const current = rankFor(xp);
  const next = nextRank(xp);
  if (!next) return 1;
  return (xp - current.minXp) / (next.minXp - current.minXp);
}

export function scoreQuiz(
  questions: readonly Question[],
  answers: readonly number[],
): QuizResult {
  const total = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const passed = total > 0 && correct / total >= PASS_RATIO;
  const perfect = total > 0 && correct === total;
  const xp = passed ? correct * XP_PER_CORRECT + (perfect ? PERFECT_BONUS : 0) : 0;
  return { correct, total, passed, xp };
}

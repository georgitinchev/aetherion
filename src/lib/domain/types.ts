import type { Question, TrialContext } from "@/lib/schemas";

export type { Question, TrialContext };

export type Lesson = {
  /** Markdown body streamed from /api/lesson. */
  content: string;
  quiz?: Question[];
};

export type Trial = {
  title: string;
  objective: string;
  lesson?: Lesson;
  completedAt?: string;
  xpEarned?: number;
};

/** The aggregate root: stored and synced as one document. */
export type Journey = {
  id: string;
  topic: string;
  title: string;
  summary: string;
  trials: Trial[];
  createdAt: string;
  updatedAt: string;
};

export type TrialStatus = "locked" | "available" | "completed";

export type Rank = { name: string; minXp: number };

export type QuizResult = {
  correct: number;
  total: number;
  passed: boolean;
  xp: number;
};

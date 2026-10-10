import type { JourneyPlan } from "@/lib/schemas";
import type { Journey, Question, QuizResult, Trial, TrialContext } from "./types";

/**
 * Pure, immutable operations on the Journey aggregate. Every function returns
 * a new Journey with `updatedAt` bumped; callers persist it via JourneyStore.
 */

const now = () => new Date().toISOString();

export function createJourney(topic: string, plan: JourneyPlan): Journey {
  const timestamp = now();
  return {
    id: crypto.randomUUID(),
    topic,
    title: plan.title,
    summary: plan.summary,
    trials: plan.trials.map(({ title, objective }) => ({ title, objective })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function updateTrial(
  journey: Journey,
  index: number,
  update: (trial: Trial) => Trial,
): Journey {
  if (!journey.trials[index]) throw new RangeError(`No trial at index ${index}`);
  return {
    ...journey,
    trials: journey.trials.map((t, i) => (i === index ? update(t) : t)),
    updatedAt: now(),
  };
}

export function withLesson(journey: Journey, index: number, content: string): Journey {
  return updateTrial(journey, index, (t) => ({ ...t, lesson: { content } }));
}

export function withQuiz(journey: Journey, index: number, quiz: Question[]): Journey {
  return updateTrial(journey, index, (t) => {
    if (!t.lesson) throw new Error("Cannot attach a quiz before the lesson exists");
    return { ...t, lesson: { ...t.lesson, quiz } };
  });
}

/** Records a passed attempt. Replaying a trial keeps the best XP score. */
export function completeTrial(journey: Journey, index: number, result: QuizResult): Journey {
  if (!result.passed) return journey;
  return updateTrial(journey, index, (t) => ({
    ...t,
    completedAt: t.completedAt ?? now(),
    xpEarned: Math.max(t.xpEarned ?? 0, result.xp),
  }));
}

/** The slice of a journey the AI routes need to stay on-topic. */
export function trialContext(journey: Journey, trialIndex: number): TrialContext {
  return {
    topic: journey.topic,
    journeyTitle: journey.title,
    trials: journey.trials.map(({ title, objective }) => ({ title, objective })),
    trialIndex,
  };
}

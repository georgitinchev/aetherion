import { describe, expect, it } from "vitest";
import { completeTrial, createJourney, withLesson, withQuiz } from "../journey";
import { journeyXp, rankFor, scoreQuiz, trialStatus } from "../progress";
import type { Question } from "../types";

const plan = {
  title: "Ways of the Force",
  summary: "Learn the basics.",
  trials: [
    { title: "One", objective: "first" },
    { title: "Two", objective: "second" },
    { title: "Three", objective: "third" },
  ],
};

const q = (answerIndex: number): Question => ({
  prompt: "?",
  options: ["a", "b", "c", "d"],
  answerIndex,
  explanation: "because",
});

describe("journey progression", () => {
  it("unlocks trials in order", () => {
    const j = createJourney("force", plan);
    expect([0, 1, 2].map((i) => trialStatus(j, i))).toEqual(["available", "locked", "locked"]);

    const done = completeTrial(j, 0, { correct: 3, total: 4, passed: true, xp: 30 });
    expect([0, 1, 2].map((i) => trialStatus(done, i))).toEqual(["completed", "available", "locked"]);
    expect(journeyXp(done)).toBe(30);
  });

  it("ignores failed attempts and keeps the best score on replay", () => {
    const j = createJourney("force", plan);
    expect(completeTrial(j, 0, { correct: 1, total: 4, passed: false, xp: 0 })).toBe(j);

    const first = completeTrial(j, 0, { correct: 4, total: 4, passed: true, xp: 50 });
    const replay = completeTrial(first, 0, { correct: 3, total: 4, passed: true, xp: 30 });
    expect(replay.trials[0].xpEarned).toBe(50);
    expect(replay.trials[0].completedAt).toBe(first.trials[0].completedAt);
  });

  it("does not mutate the original journey", () => {
    const j = createJourney("force", plan);
    const next = withLesson(j, 1, "# lesson");
    expect(j.trials[1].lesson).toBeUndefined();
    expect(next.trials[1].lesson?.content).toBe("# lesson");
  });

  it("requires a lesson before a quiz", () => {
    const j = createJourney("force", plan);
    expect(() => withQuiz(j, 0, [q(0)])).toThrow();
    expect(withQuiz(withLesson(j, 0, "x"), 0, [q(0)]).trials[0].lesson?.quiz).toHaveLength(1);
  });
});

describe("scoring", () => {
  it("passes at 60% and awards a perfect bonus", () => {
    const qs = [q(0), q(1), q(2), q(3)];
    expect(scoreQuiz(qs, [0, 1, 2, 3])).toEqual({ correct: 4, total: 4, passed: true, xp: 50 });
    expect(scoreQuiz(qs, [0, 1, 2, 0])).toEqual({ correct: 3, total: 4, passed: true, xp: 30 });
    expect(scoreQuiz(qs, [0, 1, 0, 0])).toEqual({ correct: 2, total: 4, passed: false, xp: 0 });
  });

  it("maps XP to ranks", () => {
    expect(rankFor(0).name).toBe("Youngling");
    expect(rankFor(149).name).toBe("Initiate");
    expect(rankFor(150).name).toBe("Padawan");
    expect(rankFor(99_999).name).toBe("Grand Master");
  });
});

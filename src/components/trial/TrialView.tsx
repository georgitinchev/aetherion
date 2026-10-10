"use client";

import Link from "next/link";
import { use, useState } from "react";
import { NotFoundCard, PageSpinner } from "@/components/ui/PageSpinner";
import { BottomBar } from "@/components/ui/BottomBar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { postJson } from "@/lib/api";
import { completeTrial, trialContext, withLesson, withQuiz } from "@/lib/domain/journey";
import { scoreQuiz, trialStatus } from "@/lib/domain/progress";
import type { Journey, QuizResult } from "@/lib/domain/types";
import { QuizSchema } from "@/lib/schemas";
import { useJourney } from "@/lib/store/hooks";
import { LessonReader } from "./LessonReader";
import { OracleChat } from "./OracleChat";
import { Quiz } from "./Quiz";
import { TrialResult } from "./TrialResult";

type Phase =
  | { name: "lesson" }
  | { name: "quiz"; progress: number }
  | { name: "result"; result: QuizResult };

export function TrialView({ params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index: rawIndex } = use(params);
  const index = Number(rawIndex);
  const { journey, loading, error, update } = useJourney(id);

  if (loading) return <PageSpinner />;
  if (error) return <NotFoundCard message={error} />;
  if (!journey || !Number.isInteger(index) || !journey.trials[index]) {
    return <NotFoundCard message="This trial does not exist." />;
  }
  if (trialStatus(journey, index) === "locked") {
    return <NotFoundCard message="This trial is still sealed. Complete the ones before it first." />;
  }

  // Keyed so navigating between trials resets all local state.
  return <Trial key={`${id}:${index}`} journey={journey} index={index} update={update} />;
}

function Trial({
  journey,
  index,
  update,
}: {
  journey: Journey;
  index: number;
  update: (change: (j: Journey) => Journey) => Promise<void>;
}) {
  const trial = journey.trials[index];
  const [phase, setPhase] = useState<Phase>({ name: "lesson" });
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const journeyHref = `/journey/${journey.id}`;

  async function beginTrial() {
    const lesson = trial.lesson;
    if (!lesson) return;
    if (lesson.quiz) return setPhase({ name: "quiz", progress: 0 });
    setQuizLoading(true);
    setQuizError(null);
    try {
      const { questions } = await postJson(
        "/api/quiz",
        { ...trialContext(journey, index), lesson: lesson.content },
        QuizSchema,
      );
      await update((j) => withQuiz(j, index, questions));
      setPhase({ name: "quiz", progress: 0 });
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Could not prepare the trial.");
    } finally {
      setQuizLoading(false);
    }
  }

  async function finishQuiz(answers: number[]) {
    const result = scoreQuiz(trial.lesson?.quiz ?? [], answers);
    if (result.passed) await update((j) => completeTrial(j, index, result));
    setPhase({ name: "result", result });
  }

  const progress =
    phase.name === "lesson" ? (trial.lesson ? 0.33 : 0.1) : phase.name === "quiz" ? 0.33 + phase.progress * 0.67 : 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 pt-6 sm:px-6">
        <Link href={journeyHref} className="text-2xl text-faint hover:text-text" aria-label="Back to journey">
          ✕
        </Link>
        <ProgressBar value={progress} className="flex-1" />
        <span className="font-mono text-xs text-muted">
          {index + 1}/{journey.trials.length}
        </span>
      </div>

      {phase.name === "lesson" && (
        <>
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-40 sm:px-6">
            <p className="eyebrow">Trial {index + 1}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{trial.title}</h1>
            <p className="mt-2 text-muted">{trial.objective}</p>
            <div className="mt-8">
              <LessonReader
                journey={journey}
                index={index}
                onComplete={(content) => update((j) => withLesson(j, index, content))}
              />
            </div>
          </main>
          <BottomBar>
            <button onClick={() => setChatOpen(true)} className="btn btn-ghost" disabled={!trial.lesson}>
              Ask the holocron
            </button>
            <div className="flex items-center gap-4">
              {quizError && <p className="hidden text-sm text-danger sm:block">{quizError}</p>}
              <button onClick={beginTrial} className="btn btn-primary" disabled={!trial.lesson || quizLoading}>
                {quizLoading ? (
                  <>
                    <Spinner /> Preparing
                  </>
                ) : quizError ? (
                  "Retry"
                ) : (
                  "Begin the trial"
                )}
              </button>
            </div>
          </BottomBar>
        </>
      )}

      {phase.name === "quiz" && trial.lesson?.quiz && (
        <Quiz
          questions={trial.lesson.quiz}
          onProgress={(p) => setPhase({ name: "quiz", progress: p })}
          onComplete={finishQuiz}
        />
      )}

      {phase.name === "result" && (
        <TrialResult
          result={phase.result}
          journeyHref={journeyHref}
          nextHref={
            phase.result.passed && index + 1 < journey.trials.length
              ? `/journey/${journey.id}/trial/${index + 1}`
              : null
          }
          onRetry={() => setPhase({ name: "quiz", progress: 0 })}
          onReview={() => setPhase({ name: "lesson" })}
        />
      )}

      {trial.lesson && (
        <OracleChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          chatId={`${journey.id}:${index}`}
          context={{ ...trialContext(journey, index), lesson: trial.lesson.content }}
        />
      )}
    </div>
  );
}

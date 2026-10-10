"use client";

import Link from "next/link";
import { Holocron } from "@/components/holocron/Holocron";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { nextRank, rankFor, rankProgress, totalXp } from "@/lib/domain/progress";
import type { QuizResult } from "@/lib/domain/types";
import { useJourneys } from "@/lib/store/hooks";

export function TrialResult({
  result,
  journeyHref,
  nextHref,
  onRetry,
  onReview,
}: {
  result: QuizResult;
  journeyHref: string;
  nextHref: string | null;
  onRetry: () => void;
  onReview: () => void;
}) {
  const { journeys } = useJourneys();
  const xp = journeys ? totalXp(journeys) : null;
  const upcoming = xp !== null ? nextRank(xp) : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pt-4 pb-16 text-center">
      {result.passed ? (
        <Holocron state="channeling" className="aspect-square w-64" />
      ) : (
        <div className="flex h-48 items-center text-6xl text-danger/80">✕</div>
      )}

      <p className="eyebrow">{result.passed ? "Trial complete" : "Trial failed"}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {result.passed ? "The path opens before you." : "Do or do not. Try again."}
      </h1>

      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <Stat label="Score" value={`${result.correct}/${result.total}`} tone="text-holo" />
        <Stat label="XP earned" value={`+${result.xp}`} tone="text-gold" />
      </div>

      {result.passed && xp !== null && (
        <div className="card mt-3 w-full p-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{rankFor(xp).name}</span>
            <span className="text-muted">{upcoming ? `${upcoming.minXp - xp} XP to ${upcoming.name}` : "Highest rank"}</span>
          </div>
          <ProgressBar value={rankProgress(xp)} tone="gold" className="mt-3" />
        </div>
      )}

      <div className="mt-8 flex w-full flex-col gap-3">
        {result.passed ? (
          <>
            {nextHref && (
              <Link href={nextHref} className="btn btn-primary">
                Next trial
              </Link>
            )}
            <Link href={journeyHref} className={`btn ${nextHref ? "btn-ghost" : "btn-gold"}`}>
              Back to the path
            </Link>
          </>
        ) : (
          <>
            <button onClick={onRetry} className="btn btn-primary">
              Retry the trial
            </button>
            <button onClick={onReview} className="btn btn-ghost">
              Review the lesson
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { use, type CSSProperties } from "react";
import { NotFoundCard, PageSpinner } from "@/components/ui/PageSpinner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { completedCount, journeyXp, trialStatus } from "@/lib/domain/progress";
import type { Journey, TrialStatus } from "@/lib/domain/types";
import { useJourney } from "@/lib/store/hooks";

export function JourneyView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { journey, loading, error } = useJourney(id);

  if (loading) return <PageSpinner />;
  if (error) return <NotFoundCard message={error} />;
  if (!journey) return <NotFoundCard message="This journey is not in your archives." />;

  const done = completedCount(journey);
  const finished = done === journey.trials.length;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:py-12">
      <aside className="lg:sticky lg:top-24 lg:order-2 lg:self-start">
        <div className="card p-6">
          <p className="eyebrow">{journey.topic}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{journey.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{journey.summary}</p>
          <ProgressBar value={done / journey.trials.length} tone="gold" className="mt-6" />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>
              {done}/{journey.trials.length} trials
            </span>
            <span className="text-gold">◆ {journeyXp(journey)} XP</span>
          </div>
        </div>
        {finished && (
          <div className="card mt-4 border-gold/40 p-6 text-center">
            <p className="text-3xl">◆</p>
            <p className="mt-2 font-semibold text-gold">Journey complete</p>
            <p className="mt-1 text-sm text-muted">The holocron has nothing left to teach you here.</p>
            <Link href="/" className="btn btn-gold mt-5">
              Seek new knowledge
            </Link>
          </div>
        )}
      </aside>

      <TrialPath journey={journey} />
    </main>
  );
}

function TrialPath({ journey }: { journey: Journey }) {
  const firstOpen = journey.trials.findIndex((_, i) => trialStatus(journey, i) === "available");
  return (
    <ol className="flex flex-col items-center gap-12 pt-10 pb-4 lg:order-1">
      {journey.trials.map((trial, i) => {
        const status = trialStatus(journey, i);
        // Duolingo-style meander: each node drifts along a sine wave.
        const offset = Math.round(Math.sin(i * 1.1) * 72);
        return (
          <li
            key={i}
            className="flex translate-x-[calc(var(--offset)*0.4)] flex-col items-center sm:translate-x-(--offset)"
            style={{ "--offset": `${offset}px` } as CSSProperties}
          >
            <TrialNode
              href={`/journey/${journey.id}/trial/${i}`}
              index={i}
              status={status}
              highlight={i === firstOpen}
            />
            <p
              className={`mt-3 max-w-52 text-center text-sm font-semibold ${status === "locked" ? "text-faint" : "text-text"}`}
            >
              {trial.title}
            </p>
            {status === "completed" ? (
              <p className="mt-0.5 text-xs text-gold">◆ {trial.xpEarned ?? 0} XP</p>
            ) : (
              <p className="mt-0.5 max-w-60 text-center text-xs text-muted">
                {status === "available" ? trial.objective : "Complete the previous trial"}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const NODE_STYLES: Record<TrialStatus, string> = {
  completed: "bg-gold text-bg [--lip:var(--gold-deep)]",
  available: "bg-holo text-bg [--lip:var(--holo-deep)]",
  locked: "bg-surface-2 text-faint border-2 border-border [--lip:var(--border)] cursor-not-allowed",
};

function TrialNode({
  href,
  index,
  status,
  highlight,
}: {
  href: string;
  index: number;
  status: TrialStatus;
  highlight: boolean;
}) {
  const body = (
    <span
      className={`flex size-20 items-center justify-center rounded-full text-2xl font-bold shadow-[0_6px_0_var(--lip)] transition-transform ${NODE_STYLES[status]} ${status !== "locked" ? "hover:brightness-110 active:translate-y-1.5 active:shadow-[0_0_0_var(--lip)]" : ""} ${highlight ? "pulse-ring" : ""}`}
    >
      {status === "completed" ? "✓" : status === "locked" ? <LockIcon /> : index + 1}
    </span>
  );

  return (
    <div className="relative">
      {highlight && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce rounded-xl border-2 border-border bg-surface px-3 py-1.5 text-xs font-bold tracking-wider whitespace-nowrap text-holo uppercase">
          {index === 0 ? "Start" : "Next"}
        </span>
      )}
      {status === "locked" ? (
        <span aria-label={`Trial ${index + 1}, locked`}>{body}</span>
      ) : (
        <Link href={href} aria-label={`Trial ${index + 1}, ${status}`}>
          {body}
        </Link>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

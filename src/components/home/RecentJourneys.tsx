"use client";

import Link from "next/link";
import { DeleteJourney, TrashIcon } from "@/components/journey/DeleteJourney";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { completedCount, journeyXp } from "@/lib/domain/progress";
import { useJourneys } from "@/lib/store/hooks";

export function RecentJourneys() {
  const { journeys, error, remove } = useJourneys();

  if (error) return <p className="text-center text-sm text-danger">{error}</p>;
  if (!journeys?.length) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your archives</p>
          <h2 className="mt-1 text-xl font-semibold">Journeys in progress</h2>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((j) => {
          const done = completedCount(j);
          return (
            <li key={j.id} className="group relative">
              <Link
                href={`/journey/${j.id}`}
                className="card flex h-full flex-col p-5 transition-colors hover:border-holo/40"
              >
                <p className="eyebrow truncate">{j.topic}</p>
                <h3 className="mt-2 line-clamp-2 font-semibold">{j.title}</h3>
                <div className="mt-auto pt-5">
                  <ProgressBar value={done / j.trials.length} />
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>
                      {done}/{j.trials.length} trials
                    </span>
                    <span className="text-gold">◆ {journeyXp(j)} XP</span>
                  </div>
                </div>
              </Link>
              <DeleteJourney
                title={j.title}
                onDelete={() => remove(j.id)}
                trigger={(open) => (
                  // Always visible on touch screens; revealed on hover with a mouse.
                  <button
                    onClick={open}
                    className="absolute top-3 right-3 rounded-full p-2 text-faint transition-[opacity,color] hover:bg-surface-2 hover:text-danger focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Delete ${j.title}`}
                    title="Delete journey"
                  >
                    <TrashIcon />
                  </button>
                )}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

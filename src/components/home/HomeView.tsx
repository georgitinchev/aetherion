"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Holocron } from "@/components/holocron/Holocron";
import { useSession } from "@/components/providers/SessionProvider";
import { Spinner } from "@/components/ui/Spinner";
import { postJson } from "@/lib/api";
import { createJourney } from "@/lib/domain/journey";
import { JourneyPlanSchema, TOPIC_MAX } from "@/lib/schemas";
import { RecentJourneys } from "./RecentJourneys";

const SUGGESTIONS = [
  "Kubernetes networking",
  "Music theory for producers",
  "Rust ownership & borrowing",
  "Stoic philosophy",
  "Blender hard-surface modeling",
];

const CHANNELING_LINES = [
  "Consulting the archives…",
  "Charting your path…",
  "Aligning the kyber matrix…",
  "Summoning the Gatekeeper…",
];

export function HomeView() {
  const router = useRouter();
  const { store } = useSession();
  const [topic, setTopic] = useState("");
  const [channeling, setChanneling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seek(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2 || channeling || !store) return;
    setTopic(trimmed);
    setError(null);
    setChanneling(true);
    try {
      const plan = await postJson("/api/journey", { topic: trimmed }, JourneyPlanSchema);
      const journey = createJourney(trimmed, plan);
      await store.save(journey);
      router.push(`/journey/${journey.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setChanneling(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-4 pb-16 sm:pt-8">
        <Holocron
          state={channeling ? "channeling" : "idle"}
          className="aspect-square w-[min(88vw,500px)] -mb-8 sm:-mb-12"
        />

        <p className="eyebrow">{channeling ? <ChannelingLine /> : "The holocron awaits"}</p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          What knowledge do you seek?
        </h1>

        <form
          className="mt-8 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            seek(topic);
          }}
        >
          <div className="group flex items-center gap-2 rounded-3xl border-2 border-border bg-surface p-2 pl-5 transition-colors focus-within:border-holo/60 focus-within:shadow-[0_0_40px_rgb(92_200_255/0.12)]">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={TOPIC_MAX}
              disabled={channeling}
              placeholder="Name a skill, a subject, a craft…"
              aria-label="What do you want to learn?"
              className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-faint disabled:opacity-60"
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary shrink-0 px-4"
              disabled={channeling || topic.trim().length < 2}
              aria-label="Begin journey"
            >
              {channeling ? <Spinner /> : <span>Begin</span>}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => seek(s)}
              disabled={channeling}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-holo/40 hover:text-text disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <RecentJourneys />
    </main>
  );
}

function ChannelingLine() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % CHANNELING_LINES.length), 1800);
    return () => clearInterval(id);
  }, []);
  return <span className="text-holo">{CHANNELING_LINES[i]}</span>;
}

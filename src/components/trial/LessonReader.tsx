"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { trialContext } from "@/lib/domain/journey";
import type { Journey } from "@/lib/domain/types";
import { Markdown } from "./Markdown";

/**
 * Shows the cached lesson, or streams a new one from /api/lesson and reports
 * the finished text so the caller can persist it.
 */
export function LessonReader({
  journey,
  index,
  onComplete,
}: {
  journey: Journey;
  index: number;
  onComplete: (content: string) => void;
}) {
  const cached = journey.trials[index].lesson?.content;
  const started = useRef(false);
  const [empty, setEmpty] = useState(false);
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/lesson",
    streamProtocol: "text",
    body: trialContext(journey, index),
    onFinish: (_prompt, text) => {
      if (text.trim()) onComplete(text);
      else setEmpty(true);
    },
  });

  useEffect(() => {
    // Guard against React Strict Mode's double effect firing a second request.
    if (cached || started.current) return;
    started.current = true;
    complete("");
  }, [cached, complete]);

  if (cached) return <Markdown>{cached}</Markdown>;

  if (error || empty) {
    return (
      <div className="card p-6 text-center">
        <p className="text-danger">The holocron flickered and went dark.</p>
        <button
          onClick={() => {
            setEmpty(false);
            complete("");
          }}
          className="btn btn-ghost mt-4"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!completion) {
    return (
      <div className="space-y-3" aria-label="Loading lesson">
        {[92, 100, 85, 70, 96, 60].map((w, i) => (
          <div key={i} className="h-4 animate-pulse rounded-full bg-surface-2" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  return <Markdown streaming={isLoading}>{completion}</Markdown>;
}

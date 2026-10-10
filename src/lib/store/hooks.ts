"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import type { Journey } from "@/lib/domain/types";

export function useJourneys() {
  const { store } = useSession();
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store
      .list()
      .then((list) => !cancelled && setJourneys(list))
      .catch(() => !cancelled && setError("Could not load your journeys."));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const remove = useCallback(
    async (id: string) => {
      if (!store) return;
      await store.remove(id);
      setJourneys((list) => list?.filter((j) => j.id !== id) ?? null);
    },
    [store],
  );

  return { journeys, loading: journeys === null && !error, error, remove };
}

/**
 * Loads one journey and exposes `update`, which applies a pure domain function,
 * re-renders immediately and persists in the background.
 */
export function useJourney(id: string) {
  const { store } = useSession();
  const [journey, setJourney] = useState<Journey | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef<Journey | null>(null);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    store
      .get(id)
      .then((j) => {
        if (cancelled) return;
        latest.current = j;
        setJourney(j);
      })
      .catch(() => !cancelled && setError("Could not load this journey."));
    return () => {
      cancelled = true;
    };
  }, [store, id]);

  const update = useCallback(
    async (change: (j: Journey) => Journey) => {
      if (!latest.current || !store) return;
      const next = change(latest.current);
      latest.current = next;
      setJourney(next);
      try {
        await store.save(next);
      } catch {
        setError("Progress could not be saved. Check your connection.");
      }
    },
    [store],
  );

  return { journey, loading: journey === undefined && !error, error, update };
}
